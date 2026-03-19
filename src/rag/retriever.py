"""
Simple RAG Retrieval Example

Demonstrates a minimal retrieval-augmented generation pipeline:
- Document retrieval (simulated)
- Context-grounded response generation
"""


def retrieve_documents(query: str) -> list[str]:
    """Return relevant documents for a given query."""
    # Placeholder retrieval logic — replace with vector DB lookup
    documents = [
        "Company policy states employees must work 40 hours per week.",
        "Remote work is allowed with manager approval.",
        "All remote work requests must be submitted via the HR portal.",
    ]
    # Simulate top-k retrieval
    return documents[:2]


def generate_response(query: str, context_docs: list[str]) -> str:
    """Generate a grounded response using retrieved context."""
    context = "\n".join(f"- {doc}" for doc in context_docs)

    response = (
        f"Query: {query}\n\n"
        f"Context:\n{context}\n\n"
        f"Answer:\n"
        f"The company allows remote work with manager approval and expects "
        f"a standard 40-hour work week."
    )
    return response


if __name__ == "__main__":
    query = "What is the company policy on remote work?"

    docs = retrieve_documents(query)
    answer = generate_response(query, docs)

    print(answer)
