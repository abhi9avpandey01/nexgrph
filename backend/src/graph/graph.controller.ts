import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GraphService } from './graph.service';

@UseGuards(JwtAuthGuard)
@Controller('api/graph')
export class GraphController {
  constructor(private graphService: GraphService) {}

  @Get(':workspaceId')
  getGraph(@Request() req, @Param('workspaceId') workspaceId: string) {
    return this.graphService.getGraph(req.user.userId, workspaceId);
  }

  @Get('node/:nodeId')
  getNode(@Request() req, @Param('nodeId') nodeId: string) {
    return this.graphService.getNode(req.user.userId, nodeId);
  }

  @Get('search/:workspaceId')
  search(
    @Request() req,
    @Param('workspaceId') workspaceId: string,
    @Query('q') query: string,
  ) {
    return this.graphService.searchNodes(req.user.userId, workspaceId, query);
  }
}