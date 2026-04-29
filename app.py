"""
FastAPI application — GenAI Production Starter Kit

Wraps the RAG pipeline, security guardrails, and agent router
into a deployable REST API backed by PostgreSQL + pgvector.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_postgres import PGVector
from pydantic import BaseModel

from src.agents.agent_router import classify_intent
from src.rag.reranker import RetrievedChunk, SimpleCrossEncoderReranker
from src.security.input_validation import is_prompt_safe
from src.security.pii_redaction import redact_pii


def _pg_connection() -> str:
    """Convert Railway DATABASE_URL to psycopg3 driver format."""
    url = os.environ["DATABASE_URL"]
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


_embeddings: OpenAIEmbeddings | None = None
_vector_store: PGVector | None = None
_llm: ChatOpenAI | None = None
_reranker = SimpleCrossEncoderReranker()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _embeddings, _vector_store, _llm
    _embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    _vector_store = PGVector(
        embeddings=_embeddings,
        collection_name="rag_documents",
        connection=_pg_connection(),
        use_jsonb=True,
    )
    _llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    yield


app = FastAPI(title="GenAI RAG API", version="1.0.0", lifespan=lifespan)


# --- Models ---

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10
    top_n: int = 3


class QueryResponse(BaseModel):
    intent: str
    answer: str
    sources: list[str]


class IngestRequest(BaseModel):
    text: str
    metadata: dict = {}


class IngestResponse(BaseModel):
    status: str
    chars: int


# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    if not is_prompt_safe(req.query):
        raise HTTPException(status_code=400, detail="Query blocked by security filter.")

    safe_query = redact_pii(req.query)
    intent = classify_intent(safe_query)

    results = _vector_store.similarity_search_with_score(safe_query, k=req.top_k)

    chunks = [
        RetrievedChunk(
            chunk_id=str(i),
            text=doc.page_content,
            metadata=doc.metadata,
            retrieval_score=float(score),
        )
        for i, (doc, score) in enumerate(results)
    ]
    ranked = _reranker.rerank(safe_query, chunks, top_n=req.top_n)

    if not ranked:
        return QueryResponse(
            intent=intent.value,
            answer="No relevant documents found.",
            sources=[],
        )

    context = "\n\n".join(c.text for c in ranked)
    prompt = (
        "Answer the following question using only the provided context. "
        "If the context does not contain the answer, say so.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {safe_query}\n\nAnswer:"
    )

    response = _llm.invoke(prompt)
    answer = redact_pii(response.content)

    return QueryResponse(
        intent=intent.value,
        answer=answer,
        sources=[
            c.text[:120] + "..." if len(c.text) > 120 else c.text
            for c in ranked
        ],
    )


@app.post("/ingest", response_model=IngestResponse, status_code=201)
def ingest(req: IngestRequest):
    doc = Document(page_content=req.text, metadata=req.metadata)
    _vector_store.add_documents([doc])
    return IngestResponse(status="ingested", chars=len(req.text))
