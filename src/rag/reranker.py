"""
Cross-encoder style re-ranking example for a RAG pipeline.

This file shows the retrieval refinement pattern, not a production dependency.
In production you would swap the scoring logic for:
- Amazon Bedrock re-ranker / FM-based relevance scoring
- A Hugging Face cross-encoder
- A managed ranking endpoint
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List


@dataclass
class RetrievedChunk:
    chunk_id: str
    text: str
    metadata: dict
    retrieval_score: float


@dataclass
class RankedChunk(RetrievedChunk):
    rerank_score: float


class SimpleCrossEncoderReranker:
    """
    Lightweight stand-in for a real cross-encoder.

    A real cross-encoder jointly evaluates (query, document) and produces a
    relevance score. Here we simulate that behavior with a simple lexical +
    metadata-aware scoring function so the pattern is easy to understand.
    """

    def score(self, query: str, text: str, metadata: dict | None = None) -> float:
        metadata = metadata or {}
        query_terms = set(query.lower().split())
        text_terms = set(text.lower().split())

        lexical_overlap = len(query_terms & text_terms) / max(len(query_terms), 1)

        freshness_bonus = 0.05 if metadata.get("is_current") else 0.0
        policy_bonus = 0.05 if metadata.get("document_type") == "policy" else 0.0

        return round((lexical_overlap * 0.8) + freshness_bonus + policy_bonus, 4)

    def rerank(
        self,
        query: str,
        retrieved_chunks: Iterable[RetrievedChunk],
        top_n: int = 5,
    ) -> List[RankedChunk]:
        ranked: List[RankedChunk] = []
        for chunk in retrieved_chunks:
            score = self.score(query, chunk.text, chunk.metadata)
            ranked.append(
                RankedChunk(
                    chunk_id=chunk.chunk_id,
                    text=chunk.text,
                    metadata=chunk.metadata,
                    retrieval_score=chunk.retrieval_score,
                    rerank_score=score,
                )
            )

        ranked.sort(key=lambda item: item.rerank_score, reverse=True)
        return ranked[:top_n]


if __name__ == "__main__":
    query = "What is the remote work policy for full-time employees?"
    retrieved = [
        RetrievedChunk(
            chunk_id="c1",
            text="The remote work policy allows full-time employees to work from home with manager approval.",
            metadata={"document_type": "policy", "is_current": True},
            retrieval_score=0.82,
        ),
        RetrievedChunk(
            chunk_id="c2",
            text="Office parking guidelines are updated every quarter.",
            metadata={"document_type": "facilities", "is_current": True},
            retrieval_score=0.88,
        ),
        RetrievedChunk(
            chunk_id="c3",
            text="Historical remote work guidance from 2021 is archived for reference only.",
            metadata={"document_type": "policy", "is_current": False},
            retrieval_score=0.79,
        ),
    ]

    reranker = SimpleCrossEncoderReranker()
    best_chunks = reranker.rerank(query, retrieved, top_n=2)

    for chunk in best_chunks:
        print(
            f"{chunk.chunk_id} | retrieval={chunk.retrieval_score} | "
            f"rerank={chunk.rerank_score} | {chunk.text}"
        )
