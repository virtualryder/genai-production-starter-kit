"""
Shared pytest fixtures for the GenAI Production Starter Kit test suite.

Strategy
────────
- Security and RAG unit tests require no external dependencies.
- API integration tests mock the vector store and OpenAI so tests run
  offline and deterministically in CI.
"""

import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Environment stubs (must be set before app import)
# ---------------------------------------------------------------------------

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("OPENAI_API_KEY", "test-key")


# ---------------------------------------------------------------------------
# API client fixture (mocks DB and LLM)
# ---------------------------------------------------------------------------

@pytest.fixture()
def api_client():
    """
    FastAPI TestClient with vector store and OpenAI fully mocked.

    The mock vector store returns one synthetic document chunk;
    the mock LLM agent returns a canned answer with a trace step.
    """
    mock_result = MagicMock()
    mock_result.answer = "Remote work is allowed with manager approval."
    mock_result.intent = "retrieval"
    mock_result.sources = ["Company policy states remote work requires approval."]
    mock_result.trace = [
        MagicMock(
            tool="search_docs",
            input={"query": "remote work policy"},
            output="[Source 1]: Company policy states remote work requires approval.",
        )
    ]

    with (
        patch("app._validate_env"),
        patch("app.OpenAIEmbeddings"),
        patch("app.PGVector"),
        patch("app.RAGAgent") as MockAgent,
    ):
        instance = MockAgent.return_value
        instance.run.return_value = mock_result

        # Import app *after* patches are in place
        from app import app as fastapi_app

        with TestClient(fastapi_app, raise_server_exceptions=False) as client:
            yield client
