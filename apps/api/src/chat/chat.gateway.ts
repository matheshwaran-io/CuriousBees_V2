import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ClerkService } from '../auth/clerk.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly clerkService: ClerkService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Get token from auth payload or headers
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: Missing token`);
        client.disconnect();
        return;
      }

      // Verify token
      const decoded = await this.clerkService.verifyToken(token);
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token');
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { clerkId: decoded.sub },
        select: { id: true, name: true, role: true, email: true },
      });

      if (!user) {
        throw new Error('User not found in database');
      }

      // Attach user to socket
      client.data.user = user;
      this.logger.log(`Client connected: ${client.id} (User: ${user.name})`);
    } catch (error: any) {
      this.logger.error(`Connection failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinCollaboration')
  handleJoinCollaboration(
    @ConnectedSocket() client: Socket,
    @MessageBody() collabId: string,
  ) {
    if (!client.data.user) return;
    
    const room = `collab_${collabId}`;
    client.join(room);
    this.logger.log(`User ${client.data.user.name} joined room ${room}`);
  }

  @SubscribeMessage('leaveCollaboration')
  handleLeaveCollaboration(
    @ConnectedSocket() client: Socket,
    @MessageBody() collabId: string,
  ) {
    if (!client.data.user) return;
    
    const room = `collab_${collabId}`;
    client.leave(room);
    this.logger.log(`User ${client.data.user.name} left room ${room}`);
  }

  // Called by CollaborationsService when a new message is saved
  broadcastNewMessage(collabId: string, message: any) {
    const room = `collab_${collabId}`;
    this.server.to(room).emit('newMessage', message);
    this.logger.log(`Broadcasted newMessage to room ${room}`);
  }
}
