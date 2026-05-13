"""
FastAPI application — GenAI Production Starter Kit

Wraps the LLM agent, RAG pipeline, and security guardrails into a
deployable REST API backed by PostgreSQL + pgvector.

Best-practice additions vs v1:
  - CORS middleware (configurable via ALLOWED_ORIGINS env var)
  - Request ID + response-time headers on every response
  - /metrics endpoint (in-memory counters: queries, intents, ingestions)
  - Startup env-var validation
  - Agent-based orchestration replacing keyword intent router
"""

import os
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from pydantic import BaseModel

from src.agents.llm_agent import RAGAgent
from src.rag.reranker import SimpleCrossEncoderReranker
from src.security.input_validation import is_prompt_safe
from src.security.pii_redaction import redact_pii


# ---------------------------------------------------------------------------
# Startup validation
# ---------------------------------------------------------------------------

_REQUIRED_ENV_VARS = ["DATABASE_URL", "OPENAI_API_KEY"]


def _validate_env() -> None:
    missing = [v for v in _REQUIRED_ENV_VARS if not os.environ.get(v)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}"
        )


def _pg_connection() -> str:
    """Convert Railway DATABASE_URL to psycopg3 driver format."""
    url = os.environ["DATABASE_URL"]
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


# ---------------------------------------------------------------------------
# App-level singletons
# ---------------------------------------------------------------------------

_embeddings: OpenAIEmbeddings | None = None
_vector_store: PGVector | None = None
_agent: RAGAgent | None = None
_reranker = SimpleCrossEncoderReranker()

# Simple in-memory metrics (resets on restart — swap for Prometheus in prod)
_metrics: dict = defaultdict(int)
_metrics_lock = Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_env()
    global _embeddings, _vector_store, _agent
    _embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    _vector_store = PGVector(
        embeddings=_embeddings,
        collection_name="rag_documents",
        connection=_pg_connection(),
        use_jsonb=True,
    )
    _agent = RAGAgent(vector_store=_vector_store, reranker=_reranker)
    yield


# ---------------------------------------------------------------------------
# App + middleware
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GenAI RAG API",
    version="2.0.0",
    description="Production RAG + LLM agent API with security guardrails.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next) -> Response:
    """Attach X-Request-Id and X-Response-Time-Ms to every response."""
    request_id = str(uuid.uuid4())
    start = time.perf_counter()
    response: Response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Response-Time-Ms"] = str(elapsed_ms)
    return response


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ToolCallStep(BaseModel):
    tool: str
    input: dict
    output: str


class QueryRequest(BaseModel):
    query: str
    top_k: int = 8   # kept for API compatibility; agent uses per-tool defaults
    top_n: int = 3


class QueryResponse(BaseModel):
    intent: str
    answer: str
    sources: list[str]
    trace: list[ToolCallStep] = []


class IngestRequest(BaseModel):
    text: str
    metadata: dict = {}


class IngestResponse(BaseModel):
    status: str
    chars: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "GenAI Production Starter Kit",
        "version": app.version,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": app.version}


@app.get("/metrics")
def metrics():
    """In-memory counters: total queries, intent breakdown, documents ingested."""
    with _metrics_lock:
        return dict(_metrics)


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    # --- Security: input validation ---
    if not is_prompt_safe(req.query):
        raise HTTPException(
            status_code=400,
            detail="Query blocked by security filter.",
        )

    safe_query = redact_pii(req.query)

    with _metrics_lock:
        _metrics["queries_total"] += 1

    # --- Agent orchestration ---
    result = _agent.run(safe_query)

    # --- Security: output redaction ---
    answer = redact_pii(result.answer)

    with _metrics_lock:
        _metrics[f"intent_{result.intent}"] += 1

    return QueryResponse(
        intent=result.intent,
        answer=answer,
        sources=result.sources,
        trace=[
            ToolCallStep(tool=s.tool, input=s.input, output=s.output)
            for s in result.trace
        ],
    )


@app.post("/ingest", response_model=IngestResponse, status_code=201)
def ingest(req: IngestRequest):
    doc = Document(page_content=req.text, metadata=req.metadata)
    _vector_store.add_documents([doc])

    with _metrics_lock:
        _metrics["documents_ingested"] += 1

    return IngestResponse(status="ingested", chars=len(req.text))
