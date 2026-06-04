import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClientSingleton;

  constructor() {
    this.client = prismaClientSingleton();
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get user() { return this.client.user; }
  get workspace() { return this.client.workspace; }
  get workspaceMember() { return this.client.workspaceMember; }
  get document() { return this.client.document; }
  get documentChunk() { return this.client.documentChunk; }
  get graphNode() { return this.client.graphNode; }
  get graphEdge() { return this.client.graphEdge; }
  get chatSession() { return this.client.chatSession; }
  get chatMessage() { return this.client.chatMessage; }
  get processingJob() { return this.client.processingJob; }
}