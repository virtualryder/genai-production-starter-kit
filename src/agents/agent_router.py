"""
Agent Router

Routes user intent to the appropriate tool or workflow.
In production, replace keyword matching with an LLM-based intent classifier.
"""

from enum import Enum


class Intent(str, Enum):
    RETRIEVAL = "retrieval"
    SUMMARIZATION = "summarization"
    ACTION_EXTRACTION = "action_extraction"
    UNKNOWN = "unknown"


INTENT_KEYWORDS = {
    Intent.RETRIEVAL: ["what is", "find", "search", "policy", "who", "where", "when"],
    Intent.SUMMARIZATION: ["summarize", "summary", "tldr", "overview", "brief"],
    Intent.ACTION_EXTRACTION: ["extract actions", "action items", "next steps", "tasks", "todo"],
}


def classify_intent(query: str) -> Intent:
    """Classify user query into a routing intent."""
    lowered = query.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return intent
    return Intent.UNKNOWN


def route_query(query: str) -> dict:
    """Route a query to the appropriate handler based on intent."""
    intent = classify_intent(query)

    handlers = {
        Intent.RETRIEVAL: _handle_retrieval,
        Intent.SUMMARIZATION: _handle_summarization,
        Intent.ACTION_EXTRACTION: _handle_action_extraction,
        Intent.UNKNOWN: _handle_unknown,
    }

    handler = handlers[intent]
    return handler(query)


def _handle_retrieval(query: str) -> dict:
    print(f"[Agent] Routing to RETRIEVAL handler for: '{query}'")
    return {"intent": Intent.RETRIEVAL, "response": "Retrieval result placeholder"}


def _handle_summarization(query: str) -> dict:
    print(f"[Agent] Routing to SUMMARIZATION handler for: '{query}'")
    return {"intent": Intent.SUMMARIZATION, "response": "Summary placeholder"}


def _handle_action_extraction(query: str) -> dict:
    print(f"[Agent] Routing to ACTION_EXTRACTION handler for: '{query}'")
    return {"intent": Intent.ACTION_EXTRACTION, "response": ["Action 1", "Action 2"]}


def _handle_unknown(query: str) -> dict:
    print(f"[Agent] Unknown intent for: '{query}'")
    return {"intent": Intent.UNKNOWN, "response": "I'm not sure how to handle that request."}


if __name__ == "__main__":
    queries = [
        "What is the remote work policy?",
        "Summarize the Q3 report.",
        "Extract action items from the meeting notes.",
        "Hello there.",
    ]
    for q in queries:
        result = route_query(q)
        print(f"  -> Intent: {result['intent']}, Response: {result['response']}\n")
