# GenAI Production Starter Kit

> A full-stack, production-ready multi-agent RAG system — LLM function calling, semantic retrieval, re-ranking, security guardrails, and a Next.js chat UI. Deploy to Railway in minutes.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-7B61FF?logo=railway&logoColor=white)

---

## The Problem

Most GenAI projects stop at demos. Getting to production means solving problems demos ignore:

- **Retrieval quality** — raw similarity search is noisy; you need re-ranking and compression
- **Agent routing** — keyword matching breaks on real queries; you need genuine LLM reasoning
- **Security** — LLMs are vulnerable to prompt injection and will leak PII if unguarded
- **Observability** — without traces, you can't debug why an answer was wrong
- **Deployability** — Jupyter notebooks aren't services

This repo bridges that gap with a working, deployable system you can adapt in hours.

---

## What This Solves

| Challenge | Solution in this kit |
|---|---|
| Low retrieval precision | Cross-encoder re-ranking + extractive compression |
| Brittle intent routing | GPT-4o-mini with OpenAI function calling (4 tools) |
| Prompt injection attacks | Pattern-based input validation, HTTP 400 on block |
| PII leakage | Regex redaction on both input and output |
| No explainability | Full agent trace in every API response |
| Hard to deploy | Docker + Railway config included, deploy in <5 min |
| No tests | pytest suite: unit, integration, mocked dependencies |

---

## Architecture

```
User → Next.js Chat UI → FastAPI Backend
                              │
                    ┌─────────┴─────────┐
                    │   Security Layer   │
                    │  (injection + PII) │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴──────────┐
                    │  LLM Agent         │
                    │  (GPT-4o-mini)     │
                    │                    │
                    │  ┌──────────────┐  │
                    │  │ search_docs  │  │
                    │  │summarize_docs│  │
                    │  │extract_action│  │
                    │  │check_comply  │  │
                    │  └──────┬───────┘  │
                    └─────────┼──────────┘
                              │
                    ┌─────────┴──────────┐
                    │   RAG Pipeline     │
                    │  Embed → Retrieve  │
                    │  → Re-rank → Gen   │
                    └─────────┬──────────┘
                              │
                         pgvector DB
```

See [`docs/diagram-source-mermaid.md`](docs/diagram-source-mermaid.md) for full Mermaid diagrams covering:
- Full system architecture
- RAG pipeline detail
- Agent tool-calling sequence diagram
- Security guardrails flow
- Deployment architecture

---

## How It Works

### 1. LLM Agent Orchestration

The `/query` endpoint no longer uses keyword matching. It uses **OpenAI function calling** to let GPT-4o-mini decide which tool to invoke:

| Tool | Intent | top_k | top_n |
|---|---|---|---|
| `search_docs` | Factual Q&A | 8 | 3 |
| `summarize_docs` | Summaries / overviews | 12 | 5 |
| `extract_actions` | Action items / tasks | 8 | 4 |
| `check_compliance` | Policy / compliance checks | 8 | 3 |

Each tool runs the full RAG pipeline. The agent can chain multiple tools in one request. Every tool call is recorded in the response `trace` field.

### 2. RAG Pipeline (inside every tool)

```
Query → Embed (text-embedding-3-small) → Cosine search (pgvector, top-K)
      → Cross-encoder re-rank (top-N) → Extractive compression → LLM generation
```

### 3. Security Layer

Applied to both input and output on every request:
- **Prompt injection detection** — blocks known injection patterns with HTTP 400
- **PII redaction** — masks email, phone, and SSN before they reach the LLM or logs

### 4. Observability

- **Request ID** — `X-Request-Id` header on every response for correlation
- **Response time** — `X-Response-Time-Ms` header
- **Metrics** — `GET /metrics` returns query counts, intent breakdown, and ingestion counts

---

## Repository Structure

```
app.py                          FastAPI entry point (agent, middleware, endpoints)
requirements.txt                Python dependencies

src/
  agents/
    agent_router.py             Legacy keyword router (reference)
    llm_agent.py                LLM-powered agent with 4 tools (production)
  rag/
    retriever.py                Simple retrieval example
    reranker.py                 Cross-encoder style re-ranking
    compression.py              Extractive context compression
  security/
    input_validation.py         Prompt injection detection
    pii_redaction.py            PII masking (email, phone, SSN)
  aws_example/                  AWS Bedrock + OpenSearch reference
  gcp_example/                  GCP Vertex AI + Vector Search reference

frontend/
  app/
    page.tsx                    Dashboard
    query/page.tsx              Chat interface (message history + agent trace)
    agents/page.tsx             Agent tools showcase
    ingest/page.tsx             Document ingestion
  components/
    layout/Sidebar.tsx          Navigation sidebar (desktop + mobile)
    ui/                         Badge, Button, Card, Input, Textarea, Skeleton

tests/
  conftest.py                   Shared fixtures (mocked vector store + OpenAI)
  test_security.py              Unit tests — input validation + PII redaction
  test_reranker.py              Unit tests — cross-encoder re-ranking
  test_api.py                   Integration tests — /health, /query, /ingest, /metrics

docs/
  diagram-source-mermaid.md     All architecture diagrams (Mermaid source)
  architecture-overview.md      System design narrative
  security-guardrails.md        Security controls detail
  retrieval-rerank-compress.md  RAG pattern deep-dive

notebooks/
  rag_walkthrough.ipynb         End-to-end interactive demo

sample_data/
  sample_policy.txt             Example document for first-run testing
```

---

## Quickstart (5 minutes)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL with pgvector extension (or use Railway — see Deployment)
- OpenAI API key

### 1. Clone and install backend

```bash
git clone https://github.com/virtualryder/genai-production-starter-kit
cd genai-production-starter-kit
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
cp .env.example .env            # create this file if it doesn't exist
# Edit .env:
# OPENAI_API_KEY=sk-...
# DATABASE_URL=postgresql://user:pass@localhost:5432/ragdb
```

### 3. Start the backend

```bash
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

API docs available at `http://localhost:8080/docs`

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### 5. Add sample data and query

1. Go to **Ingest** — paste the contents of `sample_data/sample_policy.txt`
2. Go to **Chat** — ask: *"What is the remote work policy?"*
3. Expand the **Agent trace** to see which tool was called and what was retrieved

---

## Running Tests

```bash
# Install test dependencies (included in requirements.txt)
pip install pytest httpx

# Run all tests
pytest tests/ -v

# Run specific suites
pytest tests/test_security.py -v      # security unit tests
pytest tests/test_reranker.py -v      # RAG unit tests
pytest tests/test_api.py -v           # API integration tests (mocked)
```

---

## API Reference

### `GET /health`

```json
{ "status": "ok", "version": "2.0.0" }
```

### `POST /query`

```json
// Request
{ "query": "What is the remote work policy?", "top_k": 8, "top_n": 3 }

// Response
{
  "intent": "retrieval",
  "answer": "Remote work is allowed with manager approval...",
  "sources": ["Company policy states employees may work remotely..."],
  "trace": [
    {
      "tool": "search_docs",
      "input": { "query": "remote work policy" },
      "output": "[Source 1 | relevance=0.821]: ..."
    }
  ]
}
```

### `POST /ingest`

```json
// Request
{ "text": "Your document text here.", "metadata": { "source": "hr-handbook" } }

// Response (201)
{ "status": "ingested", "chars": 1024 }
```

### `GET /metrics`

```json
{
  "queries_total": 42,
  "intent_retrieval": 28,
  "intent_summarization": 8,
  "intent_action_extraction": 4,
  "intent_compliance": 2,
  "documents_ingested": 12
}
```

---

## Adapting to Your Environment

### Swap the LLM

Change the model in `app.py` (`lifespan`) and `src/agents/llm_agent.py` (`RAGAgent.__init__`):

```python
# GPT-4o (better quality)
_agent = RAGAgent(vector_store=_vector_store, reranker=_reranker, model="gpt-4o")

# Claude (via OpenAI-compatible API)
_agent = RAGAgent(..., model="claude-opus-4-5-20251001")
```

### Swap the embedding model

In `app.py` `lifespan`:

```python
# Larger OpenAI model
_embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Open-source (HuggingFace)
from langchain_community.embeddings import HuggingFaceEmbeddings
_embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
```

### Swap the vector store

Replace `PGVector` in `app.py` with any LangChain-compatible vector store:

```python
# Pinecone
from langchain_pinecone import PineconeVectorStore
_vector_store = PineconeVectorStore(embedding=_embeddings, index_name="my-index")

# Weaviate
from langchain_weaviate import WeaviateVectorStore
_vector_store = WeaviateVectorStore(client=weaviate_client, embedding=_embeddings)

# Chroma (local, for development)
from langchain_chroma import Chroma
_vector_store = Chroma(embedding_function=_embeddings, persist_directory="./chroma_db")
```

### Add a new agent tool

1. Add the tool schema to `TOOLS` in `src/agents/llm_agent.py`
2. Add a case to `_execute_tool()`
3. Add the intent mapping to `TOOL_TO_INTENT`

```python
# Example: adding a "draft_response" tool
{
    "type": "function",
    "function": {
        "name": "draft_response",
        "description": "Draft a formal response based on policy documents.",
        "parameters": { ... }
    }
}
```

### Extend security guardrails

Add patterns to `src/security/input_validation.py`:

```python
BLOCKED_PATTERNS = [
    *existing_patterns,
    "your new pattern here",
]
```

Add PII types to `src/security/pii_redaction.py`:

```python
PII_PATTERNS = {
    *existing_patterns,
    "credit_card": (r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", "[REDACTED_CC]"),
}
```

---

## Multi-Cloud Reference Architectures

### AWS (Bedrock + OpenSearch)

See `src/aws_example/` for a full boto3-based reference:

| Component | AWS Service |
|---|---|
| Document storage | S3 |
| Embeddings | Bedrock (Titan Embeddings) |
| LLM generation | Bedrock (Claude / Llama) |
| Vector store | OpenSearch with kNN |
| Serving | Lambda + API Gateway |

### GCP (Vertex AI + Vector Search)

See `src/gcp_example/` for a full Vertex AI SDK reference:

| Component | GCP Service |
|---|---|
| Document storage | Cloud Storage |
| Embeddings | Vertex AI (text-embedding-gecko) |
| LLM generation | Vertex AI (Gemini) |
| Vector store | Vertex AI Vector Search |
| Serving | Cloud Run |

---

## Deployment (Railway)

Both services deploy automatically from this repo.

### Backend

```toml
# railway.toml (root)
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "sh -c 'uvicorn app:app --host 0.0.0.0 --port $PORT'"
healthcheckPath = "/health"
```

Required environment variables in Railway:
- `OPENAI_API_KEY`
- `DATABASE_URL` (auto-set by Railway PostgreSQL plugin)

### Frontend

```toml
# frontend/railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
```

Required environment variables:
- `NEXT_PUBLIC_API_URL` — URL of your deployed backend

### First deploy checklist

- [ ] Add Railway PostgreSQL service (pgvector is pre-installed)
- [ ] Set `OPENAI_API_KEY` in backend service
- [ ] Set `NEXT_PUBLIC_API_URL` in frontend service
- [ ] Deploy — Railway auto-detects and builds both services
- [ ] Hit `/health` to confirm the backend is up
- [ ] Ingest a document, then query it

---

## Production Enhancements (Roadmap)

| Enhancement | Effort | Impact |
|---|---|---|
| Replace cross-encoder with real ML model (Cohere, HuggingFace) | Medium | High retrieval quality |
| Add RAG evaluation (RAGAS — relevance, faithfulness) | Medium | Measurable quality |
| Add streaming responses (SSE / WebSocket) | Medium | Better UX |
| Persistent chat history (Redis or Postgres) | Medium | Multi-turn context |
| Rate limiting (slowapi) | Low | Production safety |
| Prometheus metrics + Grafana dashboard | Medium | Observability |
| Human-in-the-loop review workflow | High | Compliance |
| Multi-tenant document isolation | High | Enterprise ready |

---

## Author

**David Ryder**
GenAI · AI/ML · Cloud Architecture · Multi-Cloud Strategy
[GitHub](https://github.com/virtualryder) · [LinkedIn](https://linkedin.com/in/davidryder)
