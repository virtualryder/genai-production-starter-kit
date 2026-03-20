"""
Context compression examples for a RAG pipeline.

Compression helps reduce token usage and remove noisy or redundant text before
sending context to the final LLM prompt.
"""
from __future__ import annotations

from typing import Iterable, List

from src.rag.reranker import RankedChunk  # reuse the shared dataclass


class ExtractiveCompressor:
    """
    Simple sentence-level compressor.

    Keeps only sentences that share vocabulary with the query.
    In production, this could be replaced with:
    - LLM-based contextual compression
    - model-based extractive summarization
    - semantic sentence filtering
    """

    def compress(self, query: str, chunks: Iterable[RankedChunk], max_sentences: int = 4) -> List[str]:
        query_terms = set(query.lower().split())
        kept_sentences: List[str] = []

        for chunk in chunks:
            sentences = [s.strip() for s in chunk.text.split(".") if s.strip()]
            for sentence in sentences:
                sentence_terms = set(sentence.lower().split())
                overlap = len(query_terms & sentence_terms)
                if overlap > 0:
                    kept_sentences.append(sentence + ".")
                if len(kept_sentences) >= max_sentences:
                    return kept_sentences
        return kept_sentences


def build_context_block(sentences: List[str]) -> str:
    if not sentences:
        return "No relevant context found."
    return "\n".join(f"- {sentence}" for sentence in sentences)


if __name__ == "__main__":
    query = "What is the remote work policy for full-time employees?"
    chunks = [
        RankedChunk(
            chunk_id="c1",
            text=(
                "The remote work policy allows full-time employees to work from home with manager approval. "
                "Employees must remain available during core business hours. "
                "Equipment reimbursement is covered under a separate policy."
            ),
            metadata={"document_type": "policy"},
            rerank_score=0.91,
        ),
        RankedChunk(
            chunk_id="c2",
            text=(
                "Historical policy archives are stored for audit purposes. "
                "This document is not the current source of truth."
            ),
            metadata={"document_type": "archive"},
            rerank_score=0.63,
        ),
    ]

    compressor = ExtractiveCompressor()
    compressed = compressor.compress(query, chunks, max_sentences=3)
    print(build_context_block(compressed))
