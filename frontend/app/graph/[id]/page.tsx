'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';
import ReactFlow, {
  Node, Edge, Background, Controls,
  useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Dagre from '@dagrejs/dagre';

interface GraphNode {
  id: string;
  label: string;
  nodeType: string;
  sourceDocumentId?: string;
}

interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
}

interface Document {
  id: string;
  filename: string;
  status: string;
}

const nodeColors: Record<string, string> = {
  concept: '#2563eb',
  technology: '#7c3aed',
  person: '#059669',
  organization: '#d97706',
  keyword: '#dc2626',
};

const nodeTypes = ['concept', 'technology', 'person', 'organization', 'keyword'];

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return { nodes, edges };
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 50,
    ranksep: 150,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });
  nodes.forEach((n) => g.setNode(n.id, { width: 140, height: 36 }));
  edges.forEach((e) => {
    try { g.setEdge(e.source, e.target); } catch {}
  });
  Dagre.layout(g);
  return {
    nodes: nodes.map((n) => {
      try {
        const pos = g.node(n.id);
        return { ...n, position: { x: pos?.x || Math.random() * 500, y: pos?.y || Math.random() * 400 } };
      } catch {
        return { ...n, position: { x: Math.random() * 500, y: Math.random() * 400 } };
      }
    }),
    edges,
  };
}

export default function GraphPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [fetching, setFetching] = useState(true);
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(nodeTypes));
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchGraph();
      fetchDocuments();
      api.get(`/api/workspaces/${workspaceId}`)
        .then(r => setWorkspaceName(r.data.name))
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [activeTypes, search, allNodes, allEdges, selectedDoc]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/api/documents?workspaceId=${workspaceId}`);
      const processed = res.data.filter((d: Document) => d.status === 'processed');
      setDocuments(processed);
      if (processed.length > 0) setSelectedDoc(processed[0].id);
    } catch (err) { console.error(err); }
  };

  const fetchGraph = async () => {
    try {
      const res = await api.get(`/api/graph/${workspaceId}`);
      setAllNodes(res.data.nodes);
      setAllEdges(res.data.edges);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const applyFilters = () => {
    let filtered = allNodes.filter(n =>
      activeTypes.has(n.nodeType) &&
      (search === '' || n.label.toLowerCase().includes(search.toLowerCase())) &&
      (selectedDoc === null || n.sourceDocumentId === selectedDoc)
    );

    if (filtered.length > 40) filtered = filtered.slice(0, 40);

    const filteredIds = new Set(filtered.map(n => n.id));
    const filteredEdges = allEdges.filter(e =>
      filteredIds.has(e.sourceNodeId) && filteredIds.has(e.targetNodeId)
    );

    const flowNodes: Node[] = filtered.map((n) => ({
      id: n.id,
      data: { label: n.label, nodeType: n.nodeType },
      position: { x: 0, y: 0 },
      style: {
        background: nodeColors[n.nodeType] || '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        minWidth: 80,
        textAlign: 'center' as const,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        cursor: 'pointer',
      },
    }));

    const flowEdges: Edge[] = filteredEdges.map((e) => ({
  id: e.id,
  source: e.sourceNodeId,
  target: e.targetNodeId,
  label: e.relationType,
  type: 'smoothstep',
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  labelStyle: { fill: '#64748b', fontSize: 10 },
  labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
  labelBgPadding: [4, 6] as [number, number],
  labelBgBorderRadius: 4,
  markerEnd: { type: 'arrowclosed' as any, color: '#94a3b8' },
}));

    const { nodes: ln, edges: le } = getLayoutedElements(flowNodes, flowEdges);
    setNodes(ln);
    setEdges(le);
  };

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode({ id: node.id, label: node.data.label, nodeType: node.data.nodeType });
  }, []);

  if (loading || fetching) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
      <p style={{ color: 'var(--text2)', fontSize: 13 }}>Building knowledge graph...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Navbar */}
      <nav style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/workspace/${workspaceId}`)} style={{ color: 'var(--text2)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
          <span style={{ color: 'var(--border2)' }}>/</span>
          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{workspaceName} / Graph</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            {allNodes.length} total nodes
          </span>
          <Link href={`/chat/${workspaceId}`} style={{ padding: '6px 14px', background: 'var(--blue)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500 }}>
            💬 Chat
          </Link>
        </div>
      </nav>

      {/* Document Selector */}
      {documents.length > 0 && (
        <div style={{ padding: '10px 24px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, overflowX: 'auto' }}>
          <span style={{ color: 'var(--text3)', fontSize: 12, whiteSpace: 'nowrap' }}>Document:</span>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                border: `1px solid ${selectedDoc === doc.id ? 'var(--blue)' : 'var(--border)'}`,
                background: selectedDoc === doc.id ? '#dbeafe' : 'transparent',
                color: selectedDoc === doc.id ? 'var(--blue)' : 'var(--text2)',
                fontWeight: selectedDoc === doc.id ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              📄 {doc.filename}
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ padding: '10px 24px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes..."
          style={{ padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12, outline: 'none', width: 180 }}
        />
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>Type:</span>
        {nodeTypes.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${activeTypes.has(type) ? nodeColors[type] : 'var(--border)'}`,
              background: activeTypes.has(type) ? `${nodeColors[type]}18` : 'transparent',
              color: activeTypes.has(type) ? nodeColors[type] : 'var(--text3)',
              fontWeight: activeTypes.has(type) ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: activeTypes.has(type) ? nodeColors[type] : 'var(--text3)' }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 'auto' }}>
          Showing {nodes.length} nodes · {edges.length} connections
        </span>
      </div>

      {/* Graph Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8 }} />
        </ReactFlow>

        {/* Node Detail Panel */}
        {selectedNode && (
          <div style={{ position: 'absolute', top: 16, right: 16, width: 240, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node Details</span>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{selectedNode.label}</p>
              <span style={{ padding: '4px 10px', background: nodeColors[selectedNode.nodeType] || '#2563eb', color: 'white', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                {selectedNode.nodeType}
              </span>
              <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
                Click other nodes to explore connections
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {nodes.length === 0 && !fetching && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: 'var(--text)', fontWeight: 500 }}>No nodes match your filters</p>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Try adjusting the filters or selecting a different document</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}