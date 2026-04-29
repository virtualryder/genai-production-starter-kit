"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { queryRAG, type QueryResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const intentLabels: Record<string, string> = {
  retrieval: "Retrieval",
  summarization: "Summarization",
  action_extraction: "Action Extraction",
  unknown: "General",
};

const intentVariants: Record<string, "retrieval" | "summarization" | "action_extraction" | "unknown"> = {
  retrieval: "retrieval",
  summarization: "summarization",
  action_extraction: "action_extraction",
  unknown: "unknown",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}

function SourceAccordion({ sources }: { sources: string[] }) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          {sources.length} source{sources.length !== 1 ? "s" : ""} used
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {sources.map((s, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="inline-block mr-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                      #{i + 1}
                    </span>
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({ result }: { result: QueryResponse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-3"
    >
      {/* Answer */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Answer
            </span>
            <Badge variant={intentVariants[result.intent] ?? "unknown"}>
              {intentLabels[result.intent] ?? result.intent}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {result.answer}
          </p>
        </CardContent>
      </Card>

      {/* Sources */}
      <SourceAccordion sources={result.sources} />
    </motion.div>
  );
}

function EmptyState() {
  const suggestions = [
    "What is the remote work policy?",
    "Summarize the employee handbook.",
    "Extract action items from the meeting notes.",
  ];
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Ask your knowledge base
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Type a question and the RAG pipeline will retrieve, re-rank, and
        generate a grounded answer.
      </p>
      <div className="space-y-2 w-full max-w-sm">
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Try asking:
        </p>
        {suggestions.map((s) => (
          <button
            key={s}
            className="w-full text-left text-sm px-4 py-2.5 rounded-lg border border-border hover:bg-muted/60 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QueryPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await queryRAG(query.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Query
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ask a question. The pipeline retrieves, re-ranks, and generates a
          grounded answer.
        </p>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              className="pr-14 min-h-[100px] text-sm resize-none"
              disabled={loading}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                ⌘↵
              </span>
              <Button
                type="submit"
                size="icon"
                disabled={!query.trim() || loading}
                className={cn("h-8 w-8 shrink-0", loading && "opacity-60")}
                aria-label="Submit query"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Results area */}
      <div className="mt-6">
        {loading && <LoadingSkeleton />}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5"
          >
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Request failed
              </p>
              <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {result && !loading && <ResultCard result={result} />}

        {!result && !loading && !error && <EmptyState />}
      </div>
    </div>
  );
}
