# GenAI Production Starter Kit

From GenAI proof-of-concept to production-minded architecture: RAG, agents, guardrails, and multi-cloud reference patterns.

## Overview

This repository provides a practical foundation for building production-ready generative AI applications.

It demonstrates:

- Retrieval-Augmented Generation (RAG) with re-ranking and compression
- Agent-based intent routing and tool orchestration
- Security guardrails (prompt injection defense, PII redaction)
- AWS reference architecture (Bedrock + OpenSearch)
- Google Cloud reference architecture (Vertex AI + Vector Search)

## Why this exists

Many GenAI projects stop at demos or notebooks. Production systems require:

- Reliable retrieval with precision-improving re-ranking
- Context compression to reduce token cost and noise
- Orchestration and intent routing
- Security controls at input and output
- Observability and cloud-native design

This repo bridges that gap.

---

## Core Components

### 1. RAG Pipeline (`src/rag/`)
- **retriever.py** — Document retrieval and grounded response generation
- **reranker.py** — Cross-encoder style re-ranking to improve precision after retrieval
- **compression.py** — Extractive context compression to reduce token usage before generation

### 2. Agent Workflow (`src/agents/`)
- **agent_router.py** — Intent classification and routing to retrieval, summarization, or action extraction

### 3. Security Guardrails (`src/security/`)
- **input_validation.py** — Prompt injection detection and blocking
- **pii_redaction.py** — PII masking for email, phone, and SSN

### 4. AWS Reference (`src/aws_example/`)
- **bedrock_rag_example.py** — Full boto3-stubbed RAG flow (S3 → Bedrock → OpenSearch)
- **bedrock_opensearch_rag.py** — Concise step-by-step summary with re-ranking and compression

### 5. GCP Reference (`src/gcp_example/`)
- **vertex_rag_example.py** — Full Vertex AI SDK-stubbed RAG flow
- **vertex_rag_pipeline.py** — Concise step-by-step summary with re-ranking and compression

---

## Retrieval Strategy

### Semantic retrieval
Uses embeddings and vector similarity to match meaning and intent.

### Metadata-enriched retrieval
Applies structured filters — department, date, document type, security label — for precision and governance.

### Ensemble retrieval
Combines semantic search with keyword search for stronger recall on exact terms, IDs, policy numbers, and legal references.

### Cross-encoder re-ranking
After retrieving the top K chunks, a cross-encoder scores each (query, chunk) pair together for a more accurate relevance signal. Typical pattern: retrieve 20, re-rank, keep the best 3–5.

### Context compression
Removes noisy or redundant sentences before sending context to the LLM. Reduces prompt cost and often improves answer quality.

---

## Repository Structure

```
docs/
  architecture-overview.md         System design and data flow
  security-guardrails.md           Security controls and principles
  retrieval-rerank-compress.md     Retrieval, re-ranking, and compression patterns
  diagram-source-mermaid.md        Mermaid source for the pipeline diagram

src/
  rag/
    retriever.py                   Retrieval + grounded generation
    reranker.py                    Cross-encoder style re-ranking
    compression.py                 Extractive context compression
  agents/
    agent_router.py                Intent classification and tool routing
  security/
    input_validation.py            Prompt injection defense
    pii_redaction.py               PII masking
  aws_example/
    bedrock_rag_example.py         Bedrock + OpenSearch boto3 stubs
    bedrock_opensearch_rag.py      Re-rank and compress flow summary
  gcp_example/
    vertex_rag_example.py          Vertex AI SDK stubs
    vertex_rag_pipeline.py         Re-rank and compress flow summary

notebooks/
  rag_walkthrough.ipynb            End-to-end pipeline demo

diagrams/
  retrieval-rerank-compress-flow.png   Pipeline architecture diagram

sample_data/
  sample_policy.txt                Example document for testing
```

---

## Quick Start

```bash
# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the pipeline modules
python src/rag/retriever.py
python src/rag/reranker.py
python src/rag/compression.py
python src/agents/agent_router.py
python src/security/input_validation.py
python src/security/pii_redaction.py
python src/aws_example/bedrock_opensearch_rag.py
python src/gcp_example/vertex_rag_pipeline.py
```

---

## Example Use Cases

- Internal knowledge assistant
- Policy Q&A system
- Document summarization
- Action extraction agent
- Compliance document search

---

## Future Enhancements

- Evaluation pipelines (relevance, faithfulness, answer correctness)
- CI/CD integration
- Human-in-the-loop workflows
- Multi-tenant support
- Advanced agent memory and tool chaining
- LLM-based contextual compression

---

## Author

**David Ryder**
GenAI | AI/ML | Cloud Architecture | Multi-Cloud Strategy
