"""
LLM-Powered Agent Orchestrator

Replaces keyword-based routing with genuine OpenAI function calling.
The agent selects which tool(s) to invoke, chains them as needed, and
returns a structured result with a full step-by-step reasoning trace —
making every decision explainable and auditable.

Tools available to the agent
─────────────────────────────
  search_docs       → semantic retrieval for factual Q&A
  summarize_docs    → broader retrieval tuned for summarization
  extract_actions   → retrieval + action-item framing
  check_compliance  → retrieval + policy / compliance framing
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from openai import OpenAI

from src.rag.reranker import RetrievedChunk, SimpleCrossEncoderReranker


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class ToolStep:
    """One tool invocation recorded in the agent trace."""
    tool: str
    input: dict[str, Any]
    output: str          # truncated for readability in the trace


@dataclass
class AgentResult:
    """Final output of a RAGAgent.run() call."""
    answer: str
    intent: str
    trace: list[ToolStep] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# OpenAI tool definitions (function calling schema)
# ---------------------------------------------------------------------------

TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_docs",
            "description": (
                "Search the knowledge base for documents relevant to a factual question. "
                "Use for 'what', 'who', 'where', 'when', 'how' style queries."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The specific question or search phrase.",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_docs",
            "description": (
                "Retrieve a broad set of documents on a topic and produce a high-level summary. "
                "Use when the user asks to 'summarize', 'give an overview', or wants a 'tldr'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or subject to summarize.",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "extract_actions",
            "description": (
                "Retrieve documents and extract action items, tasks, or next steps. "
                "Use when the user asks for 'action items', 'next steps', 'tasks', or 'todo'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or document set to extract actions from.",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_compliance",
            "description": (
                "Search for policies or regulations and evaluate whether something is compliant. "
                "Use when the user asks if something is 'allowed', 'compliant', 'permitted', or 'against policy'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "item": {
                        "type": "string",
                        "description": "The action, process, or behaviour to check for compliance.",
                    },
                },
                "required": ["item"],
            },
        },
    },
]

# Map tool names → canonical intent labels returned in the API response
TOOL_TO_INTENT: dict[str, str] = {
    "search_docs": "retrieval",
    "summarize_docs": "summarization",
    "extract_actions": "action_extraction",
    "check_compliance": "compliance",
}

SYSTEM_PROMPT = """\
You are an expert knowledge-base assistant with access to a document retrieval system.

When a user sends a query:
1. Choose the most appropriate tool(s) to retrieve relevant context.
2. Use the retrieved context to produce an accurate, grounded answer.
3. If retrieved documents don't contain a clear answer, say so honestly.
4. Be concise, structured, and cite the retrieved content where relevant.
5. Never fabricate information not present in the documents.
"""


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

class RAGAgent:
    """
    Agentic orchestrator that uses OpenAI tool calling to drive the RAG pipeline.

    The agent autonomously decides which tool(s) to call, retrieves grounded
    context through the full RAG pipeline (embed → retrieve → re-rank), and
    generates a final LLM answer — while recording every step in a trace.

    Args:
        vector_store:  Initialised LangChain PGVector instance.
        reranker:      SimpleCrossEncoderReranker (or compatible) instance.
        model:         OpenAI chat model ID (default: gpt-4o-mini).
    """

    MAX_ITERATIONS = 6

    # Per-tool retrieval settings: (top_k for vector search, top_n after rerank)
    _TOOL_RETRIEVAL: dict[str, tuple[int, int]] = {
        "search_docs":      (8, 3),
        "summarize_docs":   (12, 5),
        "extract_actions":  (8, 4),
        "check_compliance": (8, 3),
    }

    def __init__(
        self,
        vector_store,
        reranker: SimpleCrossEncoderReranker,
        model: str = "gpt-4o-mini",
    ) -> None:
        self._vector_store = vector_store
        self._reranker = reranker
        self._client = OpenAI()
        self._model = model

    # ------------------------------------------------------------------
    # Internal retrieval helpers
    # ------------------------------------------------------------------

    def _retrieve(
        self,
        query: str,
        top_k: int = 8,
        top_n: int = 3,
    ) -> tuple[str, list[str]]:
        """
        Full RAG pipeline: embed → vector search → re-rank.

        Returns:
            context_text:    Formatted document context for the LLM prompt.
            source_snippets: Short previews of each source for the API response.
        """
        try:
            results = self._vector_store.similarity_search_with_score(query, k=top_k)
        except Exception:
            return "No documents found (retrieval error).", []

        if not results:
            return "No relevant documents found in the knowledge base.", []

        chunks = [
            RetrievedChunk(
                chunk_id=str(i),
                text=doc.page_content,
                metadata=doc.metadata,
                retrieval_score=float(score),
            )
            for i, (doc, score) in enumerate(results)
        ]

        ranked = self._reranker.rerank(query, chunks, top_n=top_n)

        context_parts: list[str] = []
        snippets: list[str] = []
        for i, chunk in enumerate(ranked):
            context_parts.append(
                f"[Source {i + 1} | relevance={chunk.rerank_score:.3f}]:\n{chunk.text}"
            )
            preview = chunk.text[:120] + ("..." if len(chunk.text) > 120 else "")
            snippets.append(preview)

        return "\n\n".join(context_parts), snippets

    def _execute_tool(
        self, name: str, args: dict[str, Any]
    ) -> tuple[str, list[str]]:
        """Dispatch a named tool call and return (context_text, source_snippets)."""
        top_k, top_n = self._TOOL_RETRIEVAL.get(name, (8, 3))

        if name == "search_docs":
            return self._retrieve(args.get("query", ""), top_k=top_k, top_n=top_n)
        elif name == "summarize_docs":
            return self._retrieve(args.get("topic", ""), top_k=top_k, top_n=top_n)
        elif name == "extract_actions":
            return self._retrieve(args.get("topic", ""), top_k=top_k, top_n=top_n)
        elif name == "check_compliance":
            return self._retrieve(args.get("item", ""), top_k=top_k, top_n=top_n)

        return "Unknown tool.", []

    # ------------------------------------------------------------------
    # Main agentic loop
    # ------------------------------------------------------------------

    def run(self, query: str) -> AgentResult:
        """
        Execute the agentic loop for a user query.

        The agent sends the query to the LLM, processes any tool calls,
        feeds results back, and repeats until the LLM produces a final
        text response or MAX_ITERATIONS is reached.

        Returns:
            AgentResult with answer, intent, trace, and sources.
        """
        result = AgentResult(answer="", intent="unknown")

        messages: list[dict] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]

        for _ in range(self.MAX_ITERATIONS):
            response = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
            )

            msg = response.choices[0].message

            # Serialise assistant message back into the conversation
            assistant_entry: dict = {"role": "assistant"}
            if msg.content:
                assistant_entry["content"] = msg.content
            if msg.tool_calls:
                assistant_entry["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in msg.tool_calls
                ]
            messages.append(assistant_entry)

            # No tool calls → agent has produced its final answer
            if not msg.tool_calls:
                result.answer = msg.content or "I was unable to produce a response."
                return result

            # Process each tool call in this turn
            for tc in msg.tool_calls:
                name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                # Record intent from the first tool invoked
                if not result.trace:
                    result.intent = TOOL_TO_INTENT.get(name, "unknown")

                tool_output, snippets = self._execute_tool(name, args)
                result.sources.extend(snippets)

                result.trace.append(
                    ToolStep(
                        tool=name,
                        input=args,
                        output=(
                            tool_output[:600] + "..."
                            if len(tool_output) > 600
                            else tool_output
                        ),
                    )
                )

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": tool_output,
                    }
                )

        result.answer = "Agent reached the maximum number of iterations without completing."
        return result
