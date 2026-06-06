<div align="center">

<img src="https://img.shields.io/badge/NexGrph-AI%20Knowledge%20Graph-2563eb?style=for-the-badge" alt="NexGrph" />

# NexGrph

### AI-Powered Knowledge Graph & Document Intelligence Platform

**Transform your documents into interactive knowledge graphs. Chat with your content. Explore connections visually.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nexgrph.vercel.app-2563eb?style=flat-square&logo=vercel)](https://nexgrph.vercel.app)
[![Built with NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e?style=flat-square&logo=nestjs)](https://nestjs.com)
[![Built with Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169e1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![AI](https://img.shields.io/badge/AI-Groq%20%2B%20LangChain-f55036?style=flat-square)](https://groq.com)

</div>

---

## 🌐 Live Demo

**[https://nexgrph.vercel.app](https://nexgrph.vercel.app)**

> Upload a PDF → Watch the AI extract a knowledge graph → Chat with your documents → Explore connections visually

---

## 🚀 What is NexGrph?

NexGrph is a SaaS platform that goes beyond traditional RAG (Retrieval-Augmented Generation) chatbots. Instead of just answering questions, it **visualizes the knowledge** inside your documents as an interactive graph.

Most AI document tools only let you chat. NexGrph lets you **see** how concepts connect.

### The Problem

- Information stays hidden inside documents
- Users cannot visualize relationships between concepts
- Cross-document knowledge discovery is limited
- Traditional chat interfaces don't support exploratory learning

### The Solution

Upload your documents → AI extracts entities and relationships → Explore a visual knowledge graph → Ask questions with cited answers

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Document Upload** | Upload PDFs, DOCX, TXT, Markdown with drag and drop |
| 🤖 **AI Processing** | Automatic text extraction, chunking, and entity extraction |
| 🕸️ **Knowledge Graph** | Visual interactive graph of concepts, people, technologies, organizations |
| 💬 **RAG Chat** | Ask questions and get cited answers grounded in your documents |
| 🧠 **Conversation Memory** | Chat remembers previous messages within a session |
| 🔍 **Graph Filters** | Filter nodes by type — concept, technology, person, organization, keyword |
| 🗂️ **Workspaces** | Organize documents into separate workspaces |
| 🔐 **Authentication** | Secure JWT-based auth with signup and login |
| ⚡ **Async Processing** | Background job queue so uploads never block the UI |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — Type-safe development
- **React Flow** — Interactive graph visualization
- **Dagre** — Automatic graph layout algorithm

### Backend
- **NestJS** — Modular Node.js framework
- **TypeScript** — End-to-end type safety
- **Prisma ORM** — Database access layer
- **BullMQ** — Background job queue
- **Multer** — File upload handling
- **Passport + JWT** — Authentication

### AI & Processing
- **Groq** — Fast LLM inference (Llama 3.1)
- **LangChain** — AI orchestration
- **pdf2json** — PDF text extraction

### Infrastructure
- **PostgreSQL** — Primary database (Railway)
- **Redis** — Job queue and caching (Railway)
- **Supabase Storage** — File storage
- **Vercel** — Frontend deployment
- **Render** — Backend deployment

---

## 🏗️ Architecture

```
User
 │
 ▼
Next.js Frontend (Vercel)
 │
 ▼
NestJS Backend API (Render)
 │
 ├──────────────────┐
 ▼                  ▼
PostgreSQL        Redis Queue
(Railway)         (Railway)
 │                  │
 │                  ▼
 │            Background Worker
 │            ┌─────────────────┐
 │            │ 1. Extract text │
 │            │ 2. Chunk text   │
 │            │ 3. Generate     │
 │            │    embeddings   │
 │            │ 4. Extract      │
 │            │    graph nodes  │
 │            └─────────────────┘
 │
 ├── Supabase Storage (PDFs)
 └── Groq LLM (Chat + Graph extraction)
```

---

## 📂 Project Structure

```
nexgrph/
├── frontend/                  # Next.js application
│   ├── app/
│   │   ├── login/             # Auth pages
│   │   ├── signup/
│   │   ├── dashboard/         # Workspace list
│   │   ├── workspace/[id]/    # Document management
│   │   ├── graph/[id]/        # Knowledge graph view
│   │   └── chat/[id]/         # RAG chat interface
│   └── lib/
│       ├── api.ts             # Axios client
│       └── auth.tsx           # Auth context
│
└── backend/                   # NestJS application
    └── src/
        ├── auth/              # JWT authentication
        ├── workspace/         # Workspace management
        ├── document/          # Document upload & management
        ├── processing/        # Background job pipeline
        │   ├── queue.service.ts
        │   ├── document.processor.ts
        │   └── graph.service.ts
        ├── graph/             # Graph API
        ├── chat/              # RAG chat API
        └── prisma.service.ts  # Database client
```

---

## 🔄 How It Works

### Document Processing Pipeline

```
1. User uploads PDF
        ↓
2. File stored in Supabase Storage
        ↓
3. Processing job created in PostgreSQL
        ↓
4. Job pushed to Redis queue (BullMQ)
        ↓
5. Background worker picks up job
        ↓
6. Text extracted from PDF (pdf2json)
        ↓
7. Text split into overlapping chunks
        ↓
8. Groq LLM extracts entities + relationships per chunk
        ↓
9. Graph nodes and edges saved to PostgreSQL
        ↓
10. Document marked as processed ✅
```

### RAG Chat Pipeline

```
1. User asks a question
        ↓
2. Keywords extracted from question
        ↓
3. Relevant chunks fetched from PostgreSQL
        ↓
4. Related graph nodes fetched
        ↓
5. Conversation history loaded
        ↓
6. Context assembled → prompt built
        ↓
7. Groq LLM generates cited answer
        ↓
8. Response + citations returned to user ✅
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL database
- Redis instance
- Supabase account (for file storage)
- Groq API key (free at console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/abhi9avpandey01/nexgrph.git
cd nexgrph
```

### 2. Set up the backend

```bash
cd backend
npm install --legacy-peer-deps
```

Create `backend/.env`:

```env
DATABASE_URL=your_postgresql_url
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GROQ_API_KEY=your_groq_api_key
```

```bash
npx prisma generate
npx prisma db push
npm run start:dev
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

```bash
npm run dev
```

### 4. Open the app

Visit `http://localhost:3000`

---

## 📊 Database Schema

| Table | Description |
|---|---|
| `users` | User accounts |
| `workspaces` | Document workspaces |
| `workspace_members` | Workspace membership and roles |
| `documents` | Uploaded document metadata |
| `document_chunks` | Text chunks from documents |
| `graph_nodes` | Extracted entities (concepts, people, etc.) |
| `graph_edges` | Relationships between entities |
| `chat_sessions` | Chat conversation sessions |
| `chat_messages` | Individual chat messages with citations |
| `processing_jobs` | Background job tracking |

---

## 🔮 Future Enhancements

- [ ] Google OAuth login
- [ ] Real-time document processing status
- [ ] Vector embeddings with pgvector for semantic search
- [ ] Graph analytics and centrality scoring
- [ ] Flashcard and quiz generation from documents
- [ ] Multi-agent research assistant
- [ ] Team collaboration with role-based access control
- [ ] Document comparison across workspaces

---

## 👨‍💻 Author

**Abhinav Pandey**

Built as a full-stack AI engineering portfolio project demonstrating:
- Full Stack Development (Next.js + NestJS)
- AI Engineering (RAG, Knowledge Graph, LLM integration)
- System Design (async queues, background workers)
- Cloud Deployment (Vercel, Render, Railway, Supabase)
- Database Design (PostgreSQL, Prisma ORM)

---

## 📄 License

MIT License — feel free to use this project as a reference or learning resource.

---

<div align="center">

**[Live Demo](https://nexgrph.vercel.app)** · **[Report Bug](https://github.com/abhi9avpandey01/nexgrph/issues)** · **[Request Feature](https://github.com/abhi9avpandey01/nexgrph/issues)**

⭐ Star this repo if you found it helpful!

</div>
