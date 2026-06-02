import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('query')
  query(
    @Request() req,
    @Body() body: { workspaceId: string; question: string; sessionId?: string },
  ) {
    return this.chatService.query(
      req.user.userId,
      body.workspaceId,
      body.question,
      body.sessionId,
    );
  }

  @Get('sessions')
  getSessions(@Request() req, @Query('workspaceId') workspaceId: string) {
    return this.chatService.getSessions(req.user.userId, workspaceId);
  }

  @Get('sessions/:id/messages')
  getMessages(@Request() req, @Param('id') id: string) {
    return this.chatService.getMessages(req.user.userId, id);
  }
}