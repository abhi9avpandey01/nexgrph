import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/workspaces')
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Post()
  create(@Request() req, @Body() body: { name: string; description?: string }) {
    return this.workspaceService.createWorkspace(req.user.userId, body.name, body.description);
  }

  @Get()
  getAll(@Request() req) {
    return this.workspaceService.getMyWorkspaces(req.user.userId);
  }

  @Get(':id')
  getOne(@Request() req, @Param('id') id: string) {
    return this.workspaceService.getWorkspaceById(req.user.userId, id);
  }
}