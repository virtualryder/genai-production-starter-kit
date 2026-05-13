"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Bot,
  User,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { queryRAG, type QueryResponse, type ToolStep } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  trace?: ToolStep[];
  sources?: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTENT_LABELS: Record<string, string> = {
  retrieval: "Retrieval",
  summarization: "Summarization",
  action_extraction: "Action Extraction",
  compliance: "Compliance",
  unknown: "General",
};

const INTENT_VARIANTS: Record<string, "retrieval" | "summarization" | "action_extraction" | "compliance" | "unknown"> = {
  retrieval: "retrieval",
  summarization: "summarization",
  action_extraction: "action_extraction",
  compliance: "compliance",
  unknown: "unknown",
};

const TOOL_ICONS: Record<string, React.ElementType> = {
  search_docs: Search,
  summarize_docs: FileText,
  extract_actions: ListChecks,
  check_compliance: ShieldCheck,
};

const TOOL_COLORS: Record<string, string> = {
  search_docs: "text-blue-600 bg-blue-50 border-blue-200",
  summarize_docs: "text-violet-600 bg-violet-50 border-violet-200",
  extract_actions: "text-orange-600 bg-orange-50 border-orange-200",
  check_compliance: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const TOOL_LABELS: Record<string, string> = {
  search_docs: "search_docs",
  summarize_docs: "summarize_docs",
  extract_actions: "extract_actions",
  check_compliance: "check_compliance",
};

const EXAMPLE_QUERIES = [
  "What is the remote work policy?",
  "Summarize the employee handbook.",
  "Extract action items from the meeting notes.",
  "Is working from a coffee shop compliant with security policy?",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TraceStep({ step, index }: { step: ToolStep; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICONS[step.tool] ?? Search;
  const colorClass = TOOL_COLORS[step.tool] ?? "text-zinc-600 bg-zinc-50 border-zinc-200";

  return (
    <div className="flex gap-2.5">
      {/* Step line */}
      <div className="flex flex-col items-center">
        <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold", colorClass)}>
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      <div className="flex-1 pb-3">
        {/* Tool chip + toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 group"
        >
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", colorClass)}>
            <Icon className="h-3 w-3" />
            {TOOL_LABELS[step.tool] ?? step.tool}
          </span>
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
            {open ? "hide output" : "show output"}
          </span>
        </button>

        {/* Input args */}
        <div className="mt-1.5 text-[11px] text-muted-foreground font-mono bg-muted/60 rounded-md px-2 py-1 border border-border">
          {Object.entries(step.input).map(([k, v]) => (
            <span key={k}>
              <span className="text-foreground/60">{k}:</span>{" "}
              <span className="text-foreground">"{String(v)}"</span>
            </span>
          ))}
        </div>

        {/* Output (expandable) */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5 border border-border max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {step.output}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentTraceAccordion({ trace }: { trace: ToolStep[] }) {
  const [open, setOpen] = useState(false);
  if (!trace.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Agent trace · {trace.length} step{trace.length !== 1 ? "s" : ""}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 pt-3">
              {trace.map((step, i) => (
                <TraceStep key={i} step={step} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SourcesAccordion({ sources }: { sources: string[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  return (
    <div className="mt-2 rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3 w-3" />
          {sources.length} source{sources.length !== 1 ? "s" : ""} retrieved
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {sources.map((s, i) => (
                <div key={i} className="px-3 py-2">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="inline-block mr-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide">
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

function AssistantMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-3 mb-4"
    >
      {/* Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>

      <div className="flex-1 min-w-0 max-w-[85%]">
        {message.error ? (
          <div className="flex items-start gap-2 rounded-2xl rounded-bl-sm border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Request failed</p>
              <p className="text-xs text-destructive/80 mt-0.5">{message.error}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
            {/* Intent badge */}
            {message.intent && (
              <div className="mb-2">
                <Badge variant={INTENT_VARIANTS[message.intent] ?? "unknown"} className="text-[10px]">
                  {INTENT_LABELS[message.intent] ?? message.intent}
                </Badge>
              </div>
            )}
            {/* Answer */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            {/* Trace + sources */}
            {message.trace && <AgentTraceAccordion trace={message.trace} />}
            {message.sources && <SourcesAccordion sources={message.sources} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UserMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end justify-end gap-3 mb-4"
    >
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5">
          <p className="text-sm text-primary-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

function EmptyState({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 border border-primary/15 mb-5">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">
        Multi-agent knowledge assistant
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
        Ask a question. The agent selects the right tool, runs the RAG pipeline,
        and returns a grounded answer with a full reasoning trace.
      </p>
      <div className="grid gap-2 w-full max-w-md">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="w-full text-left text-sm px-4 py-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/4 transition-all text-muted-foreground hover:text-foreground"
          >
            &ldquo;{q}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function QueryPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res: QueryResponse = await queryRAG(text);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.answer,
        intent: res.intent,
        trace: res.trace,
        sources: res.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        error: err instanceof Error ? err.message : "Something went wrong.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleExampleSelect(q: string) {
    setInput(q);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-foreground">Chat</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agent-powered · RAG pipeline · Full trace
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMessages([])}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 ? (
            <EmptyState onSelect={handleExampleSelect} />
          ) : (
            <>
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <UserMessage key={msg.id} message={msg} />
                ) : (
                  <AssistantMessage key={msg.id} message={msg} />
                )
              )}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              className="resize-none min-h-[52px] max-h-[180px] pr-14 text-sm leading-relaxed"
              disabled={loading}
              rows={1}
            />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground hidden sm:block">⌘↵</span>
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className={cn("h-8 w-8 shrink-0", loading && "opacity-60")}
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
