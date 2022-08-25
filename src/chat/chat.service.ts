import { Injectable } from '@nestjs/common';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { AuthenticationService } from '../auth/authentication.service';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly prisma: PrismaService,
  ) {}

  async getUserFromSocket(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const { authenticationToken } = parse(cookie);

    const user =
      await this.authenticationService.getUserFromAuthenticationToken(
        authenticationToken,
      );

    if (!user) {
      throw new WsException('Invalid credentials.');
    }
    return user;
  }

  async saveMessage(user: User, message: string) {
    const newMessage = await this.prisma.message.create({
      data: {
        user: { connect: { id: user.id } },
        message,
      },
    });

    return newMessage;
  }

  async getAllMessages() {
    return await this.prisma.message.findMany();
  }
}
