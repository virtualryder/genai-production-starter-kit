# Architecture Overview

## High-Level Flow

1. User submits query
2. System retrieves relevant context (RAG)
3. Agent determines workflow
4. LLM generates grounded response
5. Security layer validates output
6. Response returned with logging

---

## RAG Pipeline

- Load documents (PDF, text)
- Chunk into smaller segments
- Generate embeddings
- Store in vector database
- Retrieve top-k relevant chunks
- Pass to LLM for generation

---

## Agent Workflow

Agent responsibilities:
- Interpret user intent
- Route to appropriate tool
- Combine outputs into structured response

Example tools:
- Retrieval
- Summarization
- Action extraction

---

## Security Layer

Key protections:
- Prompt injection filtering
- PII masking
- Output validation
- Audit logging

---

## AWS Reference

- S3 → document storage
- Bedrock → embeddings + LLM
- OpenSearch → vector store
- Lambda → orchestration

---

## GCP Reference

- Cloud Storage → documents
- Vertex AI → embeddings + LLM
- Vector Search → retrieval
- Cloud Run → orchestration
