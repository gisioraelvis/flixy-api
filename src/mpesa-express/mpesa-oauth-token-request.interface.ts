import RequestWithUser from 'src/auth/requestWithUser.interface';

interface RequestWithMPesaOAuthToken extends RequestWithUser {
  mPesaOAuthToken: string;
}

export default RequestWithMPesaOAuthToken;
