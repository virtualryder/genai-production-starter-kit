"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FileText,
} from "lucide-react";
import { ingestDocument } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetaTag {
  id: string;
  key: string;
  value: string;
}

function MetadataField({
  tag,
  onChange,
  onRemove,
}: {
  tag: MetaTag;
  onChange: (id: string, field: "key" | "value", val: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={tag.key}
        onChange={(e) => onChange(tag.id, "key", e.target.value)}
        placeholder="key"
        className="flex-1 font-mono text-xs"
      />
      <span className="text-muted-foreground text-xs shrink-0">:</span>
      <Input
        value={tag.value}
        onChange={(e) => onChange(tag.id, "value", e.target.value)}
        placeholder="value"
        className="flex-1 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() => onRemove(tag.id)}
        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors shrink-0"
        aria-label="Remove tag"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface SuccessState {
  chars: number;
  tags: number;
}

function SuccessBanner({ chars, tags, onReset }: SuccessState & { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center py-14 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.05 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 mb-5"
      >
        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
      </motion.div>
      <h3 className="text-lg font-bold text-foreground mb-1">
        Document ingested
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {chars.toLocaleString()} characters indexed
        {tags > 0 ? ` with ${tags} metadata tag${tags !== 1 ? "s" : ""}` : ""}.
        Your knowledge base has been updated.
      </p>
      <div className="flex gap-3">
        <Button onClick={onReset} variant="secondary">
          <Plus className="h-4 w-4" />
          Add another
        </Button>
      </div>
    </motion.div>
  );
}

export default function IngestPage() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<MetaTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  function addTag() {
    setTags((t) => [
      ...t,
      { id: crypto.randomUUID(), key: "", value: "" },
    ]);
  }

  function updateTag(id: string, field: "key" | "value", val: string) {
    setTags((t) =>
      t.map((tag) => (tag.id === id ? { ...tag, [field]: val } : tag))
    );
  }

  function removeTag(id: string) {
    setTags((t) => t.filter((tag) => tag.id !== id));
  }

  function reset() {
    setText("");
    setTags([]);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    const metadata: Record<string, string> = {};
    for (const tag of tags) {
      if (tag.key.trim()) metadata[tag.key.trim()] = tag.value.trim();
    }

    setLoading(true);
    setError(null);

    try {
      await ingestDocument(text.trim(), metadata);
      setSuccess({ chars: text.trim().length, tags: Object.keys(metadata).length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.trim().length;

  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Ingest
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Add documents to your knowledge base. They&apos;ll be embedded and stored
          in pgvector for retrieval.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {success ? (
          <SuccessBanner key="success" {...success} onReset={reset} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Document content */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle>Document content</CardTitle>
                  </div>
                  <CardDescription>
                    Paste the full text you want to index. Policy documents,
                    knowledge base articles, meeting notes — anything you want to
                    query later.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your document text here…"
                    className="min-h-[200px]"
                    disabled={loading}
                  />
                  {text.trim() && (
                    <div className="flex gap-3 mt-2">
                      <Badge variant="secondary">{wordCount} words</Badge>
                      <Badge variant="secondary">
                        {charCount.toLocaleString()} chars
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Metadata</CardTitle>
                      <CardDescription className="mt-1">
                        Optional key-value tags attached to this document for
                        filtering and tracking.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addTag}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add tag
                    </Button>
                  </div>
                </CardHeader>
                {tags.length > 0 && (
                  <CardContent className="pt-0 space-y-2">
                    {tags.map((tag) => (
                      <MetadataField
                        key={tag.id}
                        tag={tag}
                        onChange={updateTag}
                        onRemove={removeTag}
                      />
                    ))}
                  </CardContent>
                )}
                {tags.length === 0 && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground py-2">
                      No tags yet. Examples:{" "}
                      <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                        source: hr-handbook
                      </code>{" "}
                      or{" "}
                      <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                        version: 2026
                      </code>
                    </p>
                  </CardContent>
                )}
              </Card>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        Ingestion failed
                      </p>
                      <p className="text-sm text-destructive/80 mt-0.5">
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  Text will be embedded using{" "}
                  <span className="font-medium text-foreground">
                    text-embedding-3-small
                  </span>{" "}
                  and stored in pgvector.
                </p>
                <Button
                  type="submit"
                  disabled={!text.trim() || loading}
                  className={cn("ml-4 shrink-0", loading && "opacity-70")}
                >
                  <Upload className="h-4 w-4" />
                  {loading ? "Indexing…" : "Index document"}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
