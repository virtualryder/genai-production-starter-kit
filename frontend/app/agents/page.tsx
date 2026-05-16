"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  ListChecks,
  ShieldCheck,
  ArrowRight,
  Brain,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  MessageSquare,
  RotateCcw,
  Send,
  Play,
} from "lucide-react";
import { queryRAG, type QueryResponse, type ToolStep } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StageStatus = "pending" | "active" | "complete";
type DemoStatus = "idle" | "loading" | "complete" | "error";

// ─── Tool metadata ────────────────────────────────────────────────────────────

const TOOL_META: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ElementType;
    badgeVariant: "retrieval" | "summarization" | "action_extraction" | "compliance";
  }
> = {
  search_docs: {
    label: "search_docs",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Search,
    badgeVariant: "retrieval",
  },
  summarize_docs: {
    label: "summarize_docs",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: FileText,
    badgeVariant: "summarization",
  },
  extract_actions: {
    label: "extract_actions",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: ListChecks,
    badgeVariant: "action_extraction",
  },
  check_compliance: {
    label: "check_compliance",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: ShieldCheck,
    badgeVariant: "compliance",
  },
};

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  {
    id: "security",
    label: "Security",
    sublabel: "Injection check · PII scan",
    icon: Shield,
    activeColor: "text-red-500",
    activeBorder: "border-red-300",
    activeBg: "bg-red-50",
  },
  {
    id: "classify",
    label: "Agent Reasons",
    sublabel: "Intent classification",
    icon: Brain,
    activeColor: "text-blue-600",
    activeBorder: "border-blue-300",
    activeBg: "bg-blue-50",
  },
  {
    id: "tool",
    label: "Tool Invoked",
    sublabel: "Function call dispatched",
    icon: Sparkles,
    activeColor: "text-primary",
    activeBorder: "border-primary/50",
    activeBg: "bg-primary/8",
  },
  {
    id: "rag",
    label: "RAG Pipeline",
    sublabel: "Retrieve · Re-rank · Compress",
    icon: SlidersHorizontal,
    activeColor: "text-violet-600",
    activeBorder: "border-violet-300",
    activeBg: "bg-violet-50",
  },
  {
    id: "generate",
    label: "Generate",
    sublabel: "Grounded answer synthesis",
    icon: Sparkles,
    activeColor: "text-emerald-600",
    activeBorder: "border-emerald-300",
    activeBg: "bg-emerald-50",
  },
];

// ms delay to activate each stage while API loads
const STAGE_DELAYS = [0, 400, 950, 1550, 2200];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PipelineNode({
  stage,
  status,
  resolvedTool,
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  status: StageStatus;
  resolvedTool?: string;
}) {
  const toolMeta =
    stage.id === "tool" && resolvedTool ? TOOL_META[resolvedTool] : null;
  const Icon = toolMeta?.icon ?? stage.icon;
  const activeColor = toolMeta?.color ?? stage.activeColor;
  const activeBorder = toolMeta?.border
    ? `border-${toolMeta.border.split("-")[1]}-300`
    : stage.activeBorder;
  const activeBg = toolMeta?.bg ?? stage.activeBg;

  return (
    <div className="flex flex-col items-center gap-0 min-w-[72px]">
      {/* Circle */}
      <div className="relative">
        {status === "active" && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.7, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-400",
            status === "pending" && "bg-muted border-border",
            status === "active" && cn(activeBg, activeBorder),
            status === "complete" && "bg-emerald-50 border-emerald-300"
          )}
        >
          {status === "complete" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 200 }}
            >
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            </motion.div>
          ) : (
            <Icon
              className={cn(
                "h-4 w-4 transition-colors duration-300",
                status === "pending" && "text-muted-foreground/30",
                status === "active" && activeColor
              )}
            />
          )}
        </div>
      </div>

      {/* Labels */}
      <div className="mt-2.5 text-center px-1">
        <p
          className={cn(
            "text-[11px] font-semibold leading-tight transition-colors duration-300",
            status === "pending" && "text-muted-foreground/30",
            status === "active" && "text-foreground",
            status === "complete" && "text-foreground"
          )}
        >
          {stage.id === "tool" && resolvedTool && status !== "pending"
            ? toolMeta?.label ?? stage.label
            : stage.label}
        </p>
        <p
          className={cn(
            "text-[10px] leading-tight mt-0.5 max-w-[70px] transition-colors duration-300",
            status === "pending" && "text-muted-foreground/20",
            status === "active" && "text-muted-foreground",
            status === "complete" && "text-muted-foreground/50"
          )}
        >
          {stage.sublabel}
        </p>
      </div>
    </div>
  );
}

function Connector({ filled }: { filled: boolean }) {
  return (
    <div className="flex-1 flex items-start pt-[22px] px-0.5">
      <div className="relative w-full h-px">
        <div className="absolute inset-0 bg-border" />
        <motion.div
          className="absolute inset-0 bg-emerald-400 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: filled ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function TraceAccordion({ trace }: { trace: ToolStep[] }) {
  const [open, setOpen] = useState(false);
  if (!trace.length) return null;
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Agent trace · {trace.length} step{trace.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
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
              {trace.map((step, i) => {
                const meta = TOOL_META[step.tool];
                const StepIcon = meta?.icon ?? Search;
                return (
                  <div key={i} className="px-3 py-2.5">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium mb-1.5",
                        meta
                          ? cn(meta.bg, meta.border, meta.color)
                          : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      <StepIcon className="h-2.5 w-2.5" />
                      {step.tool}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1 border border-border mb-1.5">
                      {Object.entries(step.input).map(([k, v]) => (
                        <span key={k}>
                          {k}:{" "}
                          <span className="text-foreground">
                            &quot;{String(v)}&quot;
                          </span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                      {step.output}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pipeline Visualizer ──────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  { label: "Policy lookup", query: "What is the remote work policy?" },
  { label: "Summarize", query: "Summarize the employee handbook." },
  { label: "Action items", query: "Extract action items from the meeting notes." },
  { label: "Compliance", query: "Is working from home compliant with security policy?" },
];

function PipelineVisualizer() {
  const [input, setInput] = useState("");
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(
    PIPELINE_STAGES.map(() => "pending")
  );
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const run = useCallback(
    async (query: string) => {
      if (!query.trim() || status === "loading") return;
      clearTimers();
      setStatus("loading");
      setResult(null);
      setError(null);
      setStageStatuses(PIPELINE_STAGES.map(() => "pending"));

      // Advance stages progressively while waiting for API
      STAGE_DELAYS.forEach((delay, idx) => {
        const t = setTimeout(() => {
          setStageStatuses((prev) =>
            prev.map((s, i) => {
              if (i < idx) return "complete";
              if (i === idx) return "active";
              return s;
            })
          );
        }, delay);
        timersRef.current.push(t);
      });

      try {
        const res = await queryRAG(query.trim());
        clearTimers();
        // Complete all stages
        setStageStatuses(PIPELINE_STAGES.map(() => "complete"));
        setResult(res);
        setStatus("complete");
      } catch (err) {
        clearTimers();
        setStageStatuses(PIPELINE_STAGES.map(() => "pending"));
        setError(err instanceof Error ? err.message : "Request failed.");
        setStatus("error");
      }
    },
    [status]
  );

  const reset = () => {
    clearTimers();
    setStatus("idle");
    setResult(null);
    setError(null);
    setInput("");
    setStageStatuses(PIPELINE_STAGES.map(() => "pending"));
  };

  const resolvedTool = result?.trace?.[0]?.tool;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Live pipeline visualizer
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ask any question and watch the agent work in real time
          </p>
        </div>
        {status !== "idle" && (
          <Button variant="secondary" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Example chips */}
      {status === "idle" && (
        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLE_QUERIES.map((eq) => (
            <button
              key={eq.label}
              onClick={() => setInput(eq.query)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/4 text-muted-foreground hover:text-foreground transition-all"
            >
              {eq.label}
            </button>
          ))}
        </div>
      )}

      {/* Query input */}
      {(status === "idle" || status === "error") && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(input)}
            placeholder="Type a question or pick an example above…"
            className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          <Button
            onClick={() => run(input)}
            disabled={!input.trim()}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <Play className="h-3 w-3" />
            Run
          </Button>
        </div>
      )}

      {/* Running query label */}
      {status === "loading" && (
        <div className="mb-6 px-3 py-2 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Query:</span>{" "}
            {input}
          </p>
        </div>
      )}

      {/* Pipeline nodes */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-start flex-1 min-w-0">
            <PipelineNode
              stage={stage}
              status={stageStatuses[i]}
              resolvedTool={resolvedTool}
            />
            {i < PIPELINE_STAGES.length - 1 && (
              <Connector filled={stageStatuses[i] === "complete"} />
            )}
          </div>
        ))}
      </div>

      {/* Result */}
      <AnimatePresence>
        {status === "complete" && result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6 space-y-3"
          >
            {/* Intent + answer */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Answer
                </span>
                {result.intent && (
                  <Badge
                    variant={
                      (TOOL_META[resolvedTool ?? ""]?.badgeVariant) ?? "unknown"
                    }
                    className="text-[10px]"
                  >
                    {result.intent}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Trace */}
            {result.trace?.length > 0 && (
              <TraceAccordion trace={result.trace} />
            )}
          </motion.div>
        )}

        {status === "error" && error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3"
          >
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-destructive">
                Request failed
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tool card with inline demo ───────────────────────────────────────────────

interface ToolCardData {
  icon: React.ElementType;
  name: string;
  label: string;
  description: string;
  when: string;
  exampleQuery: string;
  variant: "retrieval" | "summarization" | "action_extraction" | "compliance";
  color: string;
  bg: string;
  border: string;
  topK: number;
  topN: number;
}

function ToolCard({ tool }: { tool: ToolCardData }) {
  const [demoStatus, setDemoStatus] = useState<DemoStatus>("idle");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const Icon = tool.icon;

  const runExample = async () => {
    if (demoStatus === "loading") return;
    setDemoStatus("loading");
    setResult(null);
    setError(null);
    setTraceOpen(false);
    try {
      const res = await queryRAG(tool.exampleQuery);
      setResult(res);
      setDemoStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setDemoStatus("error");
    }
  };

  const reset = () => {
    setDemoStatus("idle");
    setResult(null);
    setError(null);
    setTraceOpen(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        {/* Icon + badge row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              tool.bg,
              tool.border
            )}
          >
            <Icon className={cn("h-5 w-5", tool.color)} />
          </div>
          <Badge variant={tool.variant}>{tool.label}</Badge>
        </div>

        {/* Tool name */}
        <CardTitle className="text-xs font-mono text-muted-foreground">
          {tool.name}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed mt-1">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-3">
        {/* When to use */}
        <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
            Triggers when query contains
          </p>
          <p className="text-xs text-muted-foreground">{tool.when}</p>
        </div>

        {/* Retrieval settings */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>
            top_k:{" "}
            <strong className="text-foreground font-semibold">{tool.topK}</strong>
          </span>
          <span>·</span>
          <span>
            top_n:{" "}
            <strong className="text-foreground font-semibold">{tool.topN}</strong>
          </span>
        </div>

        {/* Example query + run button */}
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
            Example query
          </p>
          <p className="text-xs text-foreground font-medium mb-2.5">
            &ldquo;{tool.exampleQuery}&rdquo;
          </p>
          <div className="flex items-center gap-2">
            {demoStatus === "idle" || demoStatus === "error" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={runExample}
                className="gap-1.5 text-xs h-7"
              >
                <Play className="h-2.5 w-2.5" />
                Run example
              </Button>
            ) : demoStatus === "loading" ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary/50"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Running…</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={reset}
                className="gap-1.5 text-xs h-7"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Inline result */}
        <AnimatePresence>
          {demoStatus === "complete" && result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              {/* Tool invoked chip */}
              {result.trace?.[0] && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    Tool invoked:
                  </span>
                  {(() => {
                    const meta = TOOL_META[result.trace[0].tool];
                    const StepIcon = meta?.icon ?? Search;
                    return (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          meta
                            ? cn(meta.bg, meta.border, meta.color)
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <StepIcon className="h-2.5 w-2.5" />
                        {result.trace[0].tool}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Answer */}
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
                  Answer
                </p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-5">
                  {result.answer}
                </p>
              </div>

              {/* Trace accordion */}
              {result.trace?.length > 0 && (
                <TraceAccordion trace={result.trace} />
              )}
            </motion.div>
          )}

          {demoStatus === "error" && error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
            >
              <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Page data ────────────────────────────────────────────────────────────────

const TOOLS: ToolCardData[] = [
  {
    icon: Search,
    name: "search_docs",
    label: "Semantic Search",
    description:
      "Embeds the query and performs cosine similarity search across the vector store, then re-ranks results with a cross-encoder for precision. Best for grounded, factual answers.",
    when: "what, who, where, when, how, find, tell me about…",
    exampleQuery: "What is the remote work policy?",
    variant: "retrieval",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    topK: 8,
    topN: 3,
  },
  {
    icon: FileText,
    name: "summarize_docs",
    label: "Document Summarization",
    description:
      "Retrieves a wider set of documents (top-K=12) and instructs the LLM to synthesize a structured, high-level summary — capturing key themes rather than specific facts.",
    when: "summarize, overview, brief me on, tldr, what does X cover…",
    exampleQuery: "Summarize the employee handbook.",
    variant: "summarization",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    topK: 12,
    topN: 5,
  },
  {
    icon: ListChecks,
    name: "extract_actions",
    label: "Action Extraction",
    description:
      "Retrieves relevant documents and directs the LLM to pull out structured action items — tasks, owners, and deadlines — in a scannable numbered format.",
    when: "action items, next steps, tasks, to-do, what needs to happen…",
    exampleQuery: "Extract action items from the meeting notes.",
    variant: "action_extraction",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    topK: 8,
    topN: 4,
  },
  {
    icon: ShieldCheck,
    name: "check_compliance",
    label: "Compliance Check",
    description:
      "Retrieves policy and regulation documents and asks the LLM to evaluate whether a specific action is permitted — returning a clear yes/no with cited evidence.",
    when: "is X allowed, is this compliant, does this violate, am I permitted…",
    exampleQuery: "Is working from a coffee shop compliant with our security policy?",
    variant: "compliance",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    topK: 8,
    topN: 3,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" },
  }),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default">Agent Orchestration</Badge>
          <Badge variant="secondary">GPT-4o-mini · OpenAI Tool Calling</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Multi-Agent Architecture
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl leading-relaxed">
          This system replaces keyword routing with genuine LLM reasoning. The agent reads
          your query, selects the right tool via OpenAI function calling, runs the full RAG
          pipeline, and returns a grounded answer — with every decision recorded in a trace.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link href="/query" className={cn(buttonVariants())}>
            <MessageSquare className="h-4 w-4" />
            Open Chat
          </Link>
          <Link href="/ingest" className={cn(buttonVariants({ variant: "secondary" }))}>
            Add Documents
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* Live Pipeline Visualizer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="mb-12"
      >
        <PipelineVisualizer />
      </motion.div>

      {/* Tool cards */}
      <div>
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground">
            Available tools
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Click <strong>Run example</strong> on any card to fire the real API and see the
            agent trace inline.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <ToolCard tool={tool} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="mt-12 rounded-2xl border border-primary/15 bg-primary/4 px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            Want the full chat experience?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Open Chat to see message history, agent trace per message, and source
            attribution — all in one view.
          </p>
        </div>
        <Link href="/query" className={cn(buttonVariants(), "shrink-0")}>
          Open Chat
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    </div>
  );
}
