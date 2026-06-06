import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class ChatService {
  private groq: Groq;

  constructor(private prisma: PrismaService) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async query(userId: string, workspaceId: string, question: string, sessionId?: string) {
  // Get or create session
  let session;
  if (sessionId) {
    session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
  }
  if (!session) {
    session = await this.prisma.chatSession.create({
      data: {
        workspaceId,
        userId,
        title: question.slice(0, 50),
      },
    });
  }

  // Get previous messages for memory
  const previousMessages = await this.prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  // Find relevant chunks
  const keywords = question.toLowerCase().split(' ').filter(w => w.length > 3);
  const chunks = await this.prisma.documentChunk.findMany({
    where: {
      document: { workspaceId },
      OR: keywords.map(keyword => ({
        content: { contains: keyword },
      })),
    },
    take: 5,
    include: { document: true },
  });

  // Find relevant graph nodes
  const nodes = await this.prisma.graphNode.findMany({
    where: {
      workspaceId,
      OR: keywords.map(keyword => ({
        label: { contains: keyword },
      })),
    },
    take: 10,
  });

  // Build context
  const chunkContext = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.document.filename}]\n${c.content}`)
    .join('\n\n');

  const graphContext = nodes.length > 0
    ? `Related concepts: ${nodes.map(n => n.label).join(', ')}`
    : '';

  // Build conversation history
  const conversationHistory = previousMessages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a helpful assistant for document analysis. Answer questions based on the provided context.

Rules:
- Always cite sources using [Source N] notation
- Use clear headings, bullet points and numbered lists where appropriate
- Keep answers concise and well structured
- If the context doesn't contain enough information, say so clearly
- Never make up information not in the context

Document Context:
${chunkContext}

${graphContext ? `Related Concepts: ${graphContext}` : ''}

${conversationHistory.length > 0 ? `Previous Conversation:\n${conversationHistory}\n` : ''}

Question: ${question}

Answer:`;

  const response = await this.groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 800,
  });

  const answer = response.choices[0]?.message?.content || 'No answer generated';

  const citations = chunks.map((c, i) => ({
    sourceNumber: i + 1,
    documentId: c.documentId,
    filename: c.document.filename,
    chunkIndex: c.chunkIndex,
    pageNumber: c.pageNumber,
    excerpt: c.content.slice(0, 150),
  }));

  await this.prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: question },
  });

  await this.prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'assistant', content: answer, citations },
  });

  return {
    sessionId: session.id,
    answer,
    citations,
    relatedNodes: nodes,
  };
}

  async getSessions(userId: string, workspaceId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId, workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMessages(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error('Session not found');

    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}