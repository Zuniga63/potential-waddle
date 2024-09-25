import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interfaces/JwtPayload.interface';

@WebSocketGateway({ cors: true, namespace: 'seed' })
export class SeedsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  logger = new Logger('SeedGateway');
  @WebSocketServer() wss: Server;

  constructor(
    @Inject(forwardRef(() => SeedsService))
    private readonly seedService: SeedsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const accessToken = client.handshake.headers.access_token as string;
      const payload: JwtPayload = this.jwtService.verify(accessToken);
      await this.seedService.registerClient({ client, userId: payload.sub });
    } catch {
      client.disconnect();
      return;
    }
    this.sendClientList();
  }

  handleDisconnect(client: Socket) {
    this.seedService.unregisterClient(client);
    this.sendClientList();
  }

  sendSeedLog(message: string, level = 0) {
    const now = new Date();
    this.wss.emit('seed-message', { date: now, message, level });
  }

  private sendClientList() {
    const clients = this.seedService.getConnectedClients();
    this.wss.emit('clients-updated', clients);
  }
}
