# GenAI Production Starter Kit

From GenAI proof-of-concept to production-minded architecture: RAG, agents, guardrails, and multi-cloud reference patterns.

## Overview

This repository provides a practical foundation for building production-ready generative AI applications.

It demonstrates:

- Retrieval-Augmented Generation (RAG)
- Agent-based workflows
- Security guardrails
- AWS reference architecture (Bedrock)
- Google Cloud reference architecture (Vertex AI)

## Why this exists

Many GenAI projects stop at demos or notebooks. Production systems require:

- Reliable retrieval
- Orchestration
- Security controls
- Observability
- Cloud-native design

This repo bridges that gap.

---

## Core Components

### 1. RAG Pipeline
- Document ingestion
- Chunking strategy
- Embeddings
- Retrieval
- Grounded generation

### 2. Agent Workflow
- Intent routing
- Tool selection
- Structured responses

### 3. Security Guardrails
- Input validation
- PII protection
- Prompt injection defense
- Audit logging

### 4. AWS Example
- Amazon Bedrock
- OpenSearch / Vector DB
- S3 document storage

### 5. GCP Example
- Vertex AI
- Vector Search
- Cloud Storage

---

## Repository Structure

```
docs/           Architecture + patterns
src/            Core logic
  rag/          RAG pipeline (retrieval + generation)
  agents/       Agent routing and tool orchestration
  security/     Input validation, PII redaction, guardrails
  aws_example/  Amazon Bedrock reference pattern
  gcp_example/  Vertex AI reference pattern
notebooks/      Walkthroughs and demos
sample_data/    Example documents for testing
```

---

## Example Use Cases

- Internal knowledge assistant
- Policy Q&A system
- Document summarization
- Action extraction agent

---

## Quick Start

```bash
pip install -r requirements.txt
python src/rag/retriever.py
```

## Future Enhancements

- Evaluation pipelines
- CI/CD
- Human-in-the-loop workflows
- Multi-tenant support
- Advanced agent memory

---

## Author

**David Ryder**
GenAI | AI/ML | Cloud Architecture | Multi-Cloud Strategy
