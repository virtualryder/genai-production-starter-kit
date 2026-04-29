export interface QueryResponse {
  intent: string;
  answer: string;
  sources: string[];
}

export interface IngestResponse {
  status: string;
  chars: number;
}

const base = "/api";

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { detail?: string }).detail ?? `Request failed (${res.status})`
    );
  }

  return res.json() as Promise<T>;
}

export function queryRAG(
  query: string,
  topK = 10,
  topN = 3
): Promise<QueryResponse> {
  return request<QueryResponse>("/query", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK, top_n: topN }),
  });
}

export function ingestDocument(
  text: string,
  metadata: Record<string, string> = {}
): Promise<IngestResponse> {
  return request<IngestResponse>("/ingest", {
    method: "POST",
    body: JSON.stringify({ text, metadata }),
  });
}

export function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>("/health", { method: "GET" });
}
