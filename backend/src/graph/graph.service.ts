import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GraphService {
  constructor(private prisma: PrismaService) {}

  async getGraph(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    const nodes = await this.prisma.graphNode.findMany({
      where: { workspaceId },
    });

    const edges = await this.prisma.graphEdge.findMany({
      where: { workspaceId },
    });

    return { nodes, edges };
  }

  async getNode(userId: string, nodeId: string) {
    const node = await this.prisma.graphNode.findUnique({
      where: { id: nodeId },
      include: {
        edgesFrom: { include: { targetNode: true } },
        edgesTo: { include: { sourceNode: true } },
        sourceDocument: true,
      },
    });
    if (!node) throw new ForbiddenException('Node not found');

    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: node.workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    return node;
  }

  async searchNodes(userId: string, workspaceId: string, query: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    return this.prisma.graphNode.findMany({
      where: {
        workspaceId,
        label: { contains: query.toLowerCase() },
      },
      take: 20,
    });
  }
}