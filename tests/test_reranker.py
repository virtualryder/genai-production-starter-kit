"""
Unit tests — RAG components (reranker, compression)

Pure-Python, no external dependencies required.
"""

import pytest

from src.rag.reranker import RankedChunk, RetrievedChunk, SimpleCrossEncoderReranker


def _make_chunk(chunk_id: str, text: str, metadata: dict | None = None, score: float = 0.8) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=chunk_id,
        text=text,
        metadata=metadata or {},
        retrieval_score=score,
    )


class TestSimpleCrossEncoderReranker:
    def setup_method(self):
        self.reranker = SimpleCrossEncoderReranker()

    def test_score_returns_float(self):
        score = self.reranker.score("remote work", "remote work policy allows flexibility")
        assert isinstance(score, float)

    def test_relevant_chunk_scores_higher(self):
        query = "remote work policy"
        relevant = "The remote work policy allows employees to work from home."
        irrelevant = "Office parking spots are available on level two."
        assert self.reranker.score(query, relevant) > self.reranker.score(query, irrelevant)

    def test_policy_bonus_applied(self):
        query = "vacation days"
        text = "vacation days are allocated per year"
        score_policy = self.reranker.score(query, text, {"document_type": "policy"})
        score_other = self.reranker.score(query, text, {"document_type": "memo"})
        assert score_policy > score_other

    def test_freshness_bonus_applied(self):
        query = "vacation days"
        text = "vacation days are allocated per year"
        score_current = self.reranker.score(query, text, {"is_current": True})
        score_old = self.reranker.score(query, text, {"is_current": False})
        assert score_current > score_old

    def test_rerank_returns_top_n(self):
        chunks = [
            _make_chunk("c1", "remote work is allowed with manager approval"),
            _make_chunk("c2", "office parking guidelines updated quarterly"),
            _make_chunk("c3", "remote employees must submit timesheets weekly"),
            _make_chunk("c4", "benefits include health and dental coverage"),
        ]
        ranked = self.reranker.rerank("remote work policy", chunks, top_n=2)
        assert len(ranked) == 2

    def test_rerank_sorted_descending(self):
        chunks = [
            _make_chunk("c1", "remote work policy for full-time staff"),
            _make_chunk("c2", "cafeteria menu changes every month"),
            _make_chunk("c3", "remote work requires a stable internet connection"),
        ]
        ranked = self.reranker.rerank("remote work", chunks, top_n=3)
        scores = [c.rerank_score for c in ranked]
        assert scores == sorted(scores, reverse=True)

    def test_rerank_empty_input(self):
        ranked = self.reranker.rerank("any query", [], top_n=3)
        assert ranked == []

    def test_rerank_top_n_larger_than_input(self):
        chunks = [_make_chunk("c1", "only one chunk")]
        ranked = self.reranker.rerank("query", chunks, top_n=10)
        assert len(ranked) == 1

    def test_ranked_chunk_has_rerank_score(self):
        chunks = [_make_chunk("c1", "remote work policy text")]
        ranked = self.reranker.rerank("remote work", chunks, top_n=1)
        assert hasattr(ranked[0], "rerank_score")
        assert isinstance(ranked[0].rerank_score, float)
