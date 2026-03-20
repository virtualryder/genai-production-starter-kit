# Retrieval, Re-Ranking, and Compression

## Why add these layers?

A basic semantic retriever is fast, but its top results are not always the best final context for generation.
A stronger production flow usually looks like this:

1. Retrieve top K chunks with semantic search, metadata filtering, or ensemble retrieval.
2. Re-rank those chunks with a cross-encoder or FM-based relevance model.
3. Compress the surviving chunks to remove noise and reduce token usage.
4. Generate a grounded answer from only the best context.

---

## Retrieval modes

### Semantic retrieval
- Uses embeddings and vector similarity
- Best for intent and meaning
- May miss exact terms or recent metadata constraints

### Metadata-enriched retrieval
- Applies structured filters such as department, region, security label, recency, or document type
- Best when precision and governance matter

### Ensemble retrieval
- Combines semantic search with keyword search, and often metadata filters
- Best for exact terms, IDs, legal references, model names, or policy numbers

---

## Cross-encoder re-ranking

A cross-encoder scores the query and candidate chunk together.
That usually gives a more accurate relevance signal than vector similarity alone, but it is slower.

Common pattern:
- Retrieve top 20 chunks quickly
- Re-rank them more carefully
- Keep the best 3 to 5

Benefits:
- Higher precision
- Better answer grounding
- Lower hallucination risk

---

## Compression

Compression reduces the amount of text passed to the final model.
This lowers prompt cost, reduces noise, and often improves answer quality.

Common options:
- Extractive compression: keep only the most relevant sentences
- LLM summarization: rewrite retrieved text into a shorter grounded summary
- Context filtering: discard redundant or stale chunks

---

## AWS mapping

- Source docs: Amazon S3
- Embeddings + generation: Amazon Bedrock
- Vector retrieval: Amazon OpenSearch Service / Serverless
- Optional metadata filters: OpenSearch fields
- Re-ranking: custom model endpoint, external cross-encoder, or application-side scorer
- Compression: app layer or model-assisted summarization before final prompt
- Observability: CloudWatch, app telemetry

---

## GCP mapping

- Source docs: Cloud Storage
- Embeddings + generation: Vertex AI
- Vector retrieval: Vertex AI Vector Search
- Metadata filters: vector index metadata filters
- Re-ranking: model-based scorer at the app layer or managed serving endpoint
- Compression: app layer or LLM-assisted contextual compression
- Observability: Cloud Logging, app telemetry
