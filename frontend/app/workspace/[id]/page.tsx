'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

interface Document { id: string; filename: string; status: string; createdAt: string; }

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  processed: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', label: 'Processed' },
  processing: { color: '#d97706', bg: 'rgba(217,119,6,0.1)', label: 'Processing' },
  failed: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', label: 'Failed' },
  pending: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)', label: 'Pending' },
};

export default function WorkspacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) { fetchDocuments(); fetchWorkspace(); } }, [user]);

  const fetchWorkspace = async () => {
    try {
      const res = await api.get(`/api/workspaces/${workspaceId}`);
      setWorkspaceName(res.data.name);
    } catch (err) { console.error(err); }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/api/documents?workspaceId=${workspaceId}`);
      setDocuments(res.data);
    } catch (err) { console.error(err); }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/api/documents/upload?workspaceId=${workspaceId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocuments();
    } catch (err) { console.error(err); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/api/documents/${docId}`);
      fetchDocuments();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Navbar */}
      <nav style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/dashboard')} style={{ color: 'var(--text2)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Dashboard
          </button>
          <span style={{ color: 'var(--border2)' }}>/</span>
          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{workspaceName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={`/graph/${workspaceId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 13 }}>
            🕸️ Graph
          </Link>
          <Link href={`/chat/${workspaceId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--blue)', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: 13, fontWeight: 500 }}>
            💬 Chat
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Documents</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>
              {documents.length} document{documents.length !== 1 ? 's' : ''} in this workspace
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? (
              <>
                <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Uploading...
              </>
            ) : '↑ Upload Document'}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={handleUpload} style={{ display: 'none' }} />
        </div>

        {/* Drag and Drop Zone — shown when no documents */}
        {documents.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              textAlign: 'center',
              padding: '80px 0',
              border: `2px dashed ${isDragging ? 'var(--blue)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              background: isDragging ? '#dbeafe' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 14 }}>
              {isDragging ? '📂' : '📄'}
            </div>
            <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: 15, marginBottom: 6 }}>
              {isDragging ? 'Drop your file here' : 'Drag and drop your document here'}
            </p>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>or click to browse files</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 6 }}>
              Supports PDF, DOCX, TXT, Markdown
            </p>
          </div>
        ) : (

          /* Document List with Drag and Drop overlay */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ position: 'relative', minHeight: 100 }}
          >
            {/* Drag overlay when files are dragged over existing list */}
            {isDragging && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: 'rgba(219,234,254,0.92)',
                border: '2px dashed var(--blue)',
                borderRadius: 'var(--radius)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <div style={{ fontSize: 44 }}>📂</div>
                <p style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 15 }}>Drop to upload</p>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>File will be added to this workspace</p>
              </div>
            )}

            {/* Documents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => {
                const status = statusConfig[doc.status] || statusConfig.pending;
                return (
                  <div
                    key={doc.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', transition: 'border-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border2)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        📄
                      </div>
                      <div>
                        <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{doc.filename}</p>
                        <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 3 }}>
                          {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ padding: '4px 10px', background: status.bg, color: status.color, borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                        {status.label}
                      </span>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        style={{ padding: '5px 12px', background: 'none', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Drop hint at bottom */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ textAlign: 'center', padding: '16px', border: '1px dashed var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)'; }}
              >
                + Drop a file here or click to upload another document
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}