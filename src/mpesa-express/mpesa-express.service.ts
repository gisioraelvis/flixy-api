import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import RequestWithMPesaOAuthToken from './mpesa-oauth-token-request.interface';
import { mPesaTimeStamp } from '../utils/utils';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MpesaExpressService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private currentSingleMovieId: number;
  private curentUserId: number;

  /**
   * Initiate M-Pesa Express Transaction for a single movie
   */
  async pay(singleMovieId: number, req: RequestWithMPesaOAuthToken) {
    // get single the SingleMovie price
    const singleMovie = await this.prisma.singleMovie.findUnique({
      where: { id: singleMovieId },
    });
    if (!singleMovie) {
      throw new BadRequestException(
        `SingleMovie id #${singleMovieId} does not exist`,
      );
    }

    // set the amount to be paid(amount is assumed to be in Ksh)
    const amount: number = singleMovie.price;

    // set the current SingleMovie id
    this.currentSingleMovieId = singleMovieId;

    // get the user phoneNumber
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) {
      throw new BadRequestException(`User id #${req.user.id} does not exist`);
    }
    const phoneNumber = user.phoneNumber;

    // set the current user id
    this.curentUserId = user.id;

    // Access token from request object
    const token = req.mPesaOAuthToken;
    const auth = `Bearer ${token}`;

    // M-Pesa Express API endpoint
    const mPesaExpressEndpoint = this.configService.get(
      'MPESA_EXPRESS_ENDPOINT',
    );

    const businessShortCode = this.configService.get('MPESA_SHORTCODE');
    const passKey = this.configService.get('MPESA_EXPRESS_PASSKEY');
    const currentTimestamp = mPesaTimeStamp();

    const password = Buffer.from(
      `${businessShortCode}${passKey}${currentTimestamp}`,
    ).toString('base64');

    const transcationType = 'CustomerPayBillOnline';

    // Sender, should follow the format:2547xxxxxxxx
    const partyA = this.configService.get('MPESA_PARTY_A');

    // The business short code (Till or Pay Bill)
    const partyB = this.configService.get('MPESA_SHORTCODE');

    // Response callback endpoint. (ngrok endpoint in dev mode)
    // e.g https://f8f8f8f8.ngrok.io/mpesa-express/callback
    const callBackURL = `${this.configService.get(
      'MPESA_CALLBACK_URL',
    )}/v1/mpesa-express/single-movie/callback`;

    const accountReference = `Payment by user id #${user.id} for SingleMovie id #${singleMovieId}`;
    const transactionDesc = 'Paid with M-Pesa Express';

    try {
      const { data } = await axios.post(
        mPesaExpressEndpoint,
        {
          BusinessShortCode: businessShortCode,
          Password: password,
          Timestamp: currentTimestamp,
          TransactionType: transcationType,
          Amount: amount,
          PartyA: partyA,
          PartyB: partyB,
          PhoneNumber: phoneNumber,
          CallBackURL: callBackURL,
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        },
        {
          headers: {
            Authorization: auth,
          },
        },
      );

      // TODO: examine the data returned from the M-Pesa Express API
      return {
        success: true,
        message: data,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while initiating M-Pesa Express transaction: ${err['response']['statusText']}`,
      );
    }
  }

  /* Request cancelled by user response
{
    "Body": {
        "stkCallback": {
            "MerchantRequestID": "29562-42987865-1",
            "CheckoutRequestID": "ws_CO_21072022112533312705640212",
            "ResultCode": 1032,
            "ResultDesc": "Request cancelled by user"
        }
    }
}
 */

  /* Successful response, transaction completed
{
    "Body": {
        "stkCallback": {
            "MerchantRequestID": "4784-81832918-1",
            "CheckoutRequestID": "ws_CO_21072022112709128705640212",
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "CallbackMetadata": {
                "Item": [
                    {
                        "Name": "Amount",
                        "Value": 1
                    },
                    {
                        "Name": "MpesaReceiptNumber",
                        "Value": "QGL5TN3TSX"
                    },
                    {
                        "Name": "Balance"
                    },
                    {
                        "Name": "TransactionDate",
                        "Value": 20220721112725
                    },
                    {
                        "Name": "PhoneNumber",
                        "Value": 254705640212
                    }
                ]
            }
        }
    }
}
*/

  /**
   * Handle M-Pesa callback responses
   */
  async callback(req: Request): Promise<any> {
    const callbackResponse = req.body.Body.stkCallback;

    // If transaction was successful add the SingleMovie to the UserPremieringSingleMoviePurchase
    // else send error message to user
    if (
      callbackResponse.ResultCode === 0 ||
      callbackResponse.ResultDesc ===
        'The service request is processed successfully.'
    ) {
      // get the MpesaReceiptNumber
      const mpesaReceiptNumber =
        callbackResponse.CallbackMetadata.Item[1].Value;

      // get the amount paid
      const amount = callbackResponse.CallbackMetadata.Item[0].Value;

      // add the SingleMovie to the UserPremieringSingleMoviePurchase table
      const singleMoviePurchase =
        await this.prisma.userPremieringSingleMoviePurchase.create({
          data: {
            user: { connect: { id: this.curentUserId } },
            singleMovie: { connect: { id: this.currentSingleMovieId } },
            mpesaReceiptNumber,
            amount,
          },
        });

      return {
        success: true,
        message: callbackResponse.ResultDesc,
        singleMoviePurchase,
      };
    } else {
      // Transaction failed
      // Possible reasons:
      // 1. User cancelled the transaction
      // 2. User did not enter the correct M-Pesa PIN
      // 3. User has insufficient funds to complete the transaction
      // etc.

      throw new BadRequestException({
        success: false,
        message: callbackResponse.ResultDesc,
      });
    }
  }
}
