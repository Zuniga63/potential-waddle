import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { RafaService } from './services/rafa.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { JwtAuthGuard, JwtOptionalAuthGuard } from '../auth/guards';

@Controller('rafa')
export class RafaController {
  constructor(private readonly rafaService: RafaService) {}

  /**
   * Main chat endpoint
   * POST /rafa/chat
   *
   * Accepts user message and optional conversation ID
   * Returns AI response with intent classification and search results
   */
  @Post('chat')
  @UseGuards(JwtOptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatRequestDto, @Request() req: any): Promise<ChatResponseDto> {
    const userId = req.user?.id;
    return this.rafaService.chat(dto, userId);
  }

  /**
   * Get conversation history
   * GET /rafa/conversation/:id
   */
  @Get('conversation/:id')
  @UseGuards(JwtOptionalAuthGuard)
  async getConversation(@Param('id') id: string) {
    const conversation = await this.rafaService.getConversation(id);
    if (!conversation) {
      return { error: 'Conversation not found' };
    }
    return conversation;
  }

  /**
   * Create a lead (booking request)
   * POST /rafa/lead
   */
  @Post('lead')
  @UseGuards(JwtAuthGuard)
  async createLead(
    @Body()
    body: {
      conversationId: string;
      entityType: 'lodging' | 'restaurant' | 'experience' | 'guide' | 'transport' | 'commerce';
      entityId: string;
    },
  ) {
    const lead = await this.rafaService.createLead(body.conversationId, body.entityType, body.entityId);
    return {
      message: 'Lead created successfully',
      lead,
    };
  }
}
