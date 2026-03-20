"""
Conceptual AWS flow: Bedrock + OpenSearch for retrieval, re-ranking, and compression.

This is intentionally lightweight and educational.
"""
from __future__ import annotations


def aws_flow_summary() -> list[str]:
    return [
        "1. Store source documents in Amazon S3.",
        "2. Chunk documents and create embeddings using an embedding model in Amazon Bedrock.",
        "3. Index vectors and metadata into Amazon OpenSearch Service / Serverless.",
        "4. Run semantic search (and optionally keyword or metadata filters) in OpenSearch.",
        "5. Re-rank the top K results with a cross-encoder or FM-based relevance scorer.",
        "6. Compress the surviving chunks to reduce token count and noise.",
        "7. Send compressed context to the Bedrock text model for grounded generation.",
        "8. Log prompts, retrieval data, and outputs with CloudWatch / application logs.",
    ]


if __name__ == "__main__":
    for line in aws_flow_summary():
        print(line)
