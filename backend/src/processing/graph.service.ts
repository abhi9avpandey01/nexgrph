import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private groq: Groq;

  constructor(private prisma: PrismaService) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async extractAndStoreGraph(documentId: string, workspaceId: string, chunks: string[]) {
    this.logger.log(`Extracting graph for document ${documentId}`);

    const allNodes = new Map<string, string>();
    const allEdges: { source: string; target: string; relation: string }[] = [];

    const chunksToProcess = chunks.slice(0, 5);

    for (const chunk of chunksToProcess) {
      try {
        const result = await this.extractFromChunk(chunk);
        for (const node of result.nodes) {
          if (node.label && node.type) {
            allNodes.set(node.label.toLowerCase(), node.type);
          }
        }
        for (const edge of result.edges) {
          if (edge.source && edge.target && edge.relation) {
            allEdges.push(edge);
          }
        }
      } catch (error) {
        this.logger.error(`Error extracting from chunk: ${error.message}`);
      }
    }

    const nodeMap = new Map<string, string>();
    for (const [label, type] of allNodes) {
      const node = await this.prisma.graphNode.create({
        data: {
          workspaceId,
          label,
          nodeType: type,
          sourceDocumentId: documentId,
        },
      });
      nodeMap.set(label, node.id);
    }

    for (const edge of allEdges) {
      const sourceId = nodeMap.get(edge.source.toLowerCase());
      const targetId = nodeMap.get(edge.target.toLowerCase());
      if (sourceId && targetId) {
        await this.prisma.graphEdge.create({
          data: {
            workspaceId,
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            relationType: edge.relation,
            sourceDocumentId: documentId,
          },
        });
      }
    }

    this.logger.log(`Graph extracted: ${allNodes.size} nodes, ${allEdges.length} edges`);
  }

  private async extractFromChunk(chunk: string): Promise<{
    nodes: { label: string; type: string }[];
    edges: { source: string; target: string; relation: string }[];
  }> {
    const prompt = `Extract entities and relationships from this text.
Return ONLY a JSON object with this exact format, no other text:
{
  "nodes": [
    {"label": "entity name", "type": "concept|technology|person|organization|keyword"}
  ],
  "edges": [
    {"source": "entity1", "target": "entity2", "relation": "relationship description"}
  ]
}

Text: ${chunk.slice(0, 300)}`;

    const response = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { nodes: [], edges: [] };
      const cleaned = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, ' ');
      const parsed = JSON.parse(cleaned);
      return {
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      };
    } catch {
      return { nodes: [], edges: [] };
    }
  }
}