"""
Conceptual GCP flow: Vertex AI + Vector Search for retrieval, re-ranking, and compression.
"""
from __future__ import annotations


def gcp_flow_summary() -> list[str]:
    return [
        "1. Store source documents in Cloud Storage.",
        "2. Chunk documents and create embeddings with a Vertex AI embedding model.",
        "3. Store vectors and metadata in Vertex AI Vector Search.",
        "4. Run semantic retrieval plus metadata filters.",
        "5. Re-rank the top K retrieved chunks with a cross-encoder or model-based scorer.",
        "6. Compress relevant context to improve prompt efficiency.",
        "7. Send the refined context to a Vertex AI generative model.",
        "8. Capture observability and trace data in Cloud Logging / app telemetry.",
    ]


if __name__ == "__main__":
    for line in gcp_flow_summary():
        print(line)
