import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async createWorkspace(userId: string, name: string, description?: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        ownerId: userId,
        name,
        description,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });
    return workspace;
  }

  async getMyWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return memberships.map((m) => m.workspace);
  }

  async getWorkspaceById(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } }, documents: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }
}