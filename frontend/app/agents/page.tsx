"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  ListChecks,
  ShieldCheck,
  ArrowRight,
  Brain,
  Zap,
  GitMerge,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const tools = [
  {
    icon: Search,
    name: "search_docs",
    label: "Semantic Search",
    description:
      "Embeds the query and performs vector similarity search across the knowledge base, then re-ranks results with a cross-encoder for precision.",
    when: "Factual Q&A — what, who, where, when, how",
    example: '"What is the remote work policy?"',
    variant: "retrieval" as const,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    topK: 8,
    topN: 3,
  },
  {
    icon: FileText,
    name: "summarize_docs",
    label: "Document Summarization",
    description:
      "Retrieves a broader set of documents on a topic (higher top-K) and instructs the LLM to synthesize a coherent, structured summary.",
    when: "Summarize, overview, TL;DR, brief me on…",
    example: '"Summarize the employee handbook."',
    variant: "summarization" as const,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
    topK: 12,
    topN: 5,
  },
  {
    icon: ListChecks,
    name: "extract_actions",
    label: "Action Extraction",
    description:
      "Retrieves relevant documents and directs the LLM to extract structured action items, tasks, owners, and deadlines in a scannable format.",
    when: "Action items, next steps, tasks, to-do",
    example: '"Extract action items from the meeting notes."',
    variant: "action_extraction" as const,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    topK: 8,
    topN: 4,
  },
  {
    icon: ShieldCheck,
    name: "check_compliance",
    label: "Compliance Check",
    description:
      "Searches for policies, regulations, and guidelines, then asks the LLM to evaluate whether an action or process is compliant — with citations.",
    when: "Is X allowed? Is this compliant? Does this follow policy?",
    example: '"Is working from a café compliant with our security policy?"',
    variant: "compliance" as const,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    topK: 8,
    topN: 3,
  },
];

const steps = [
  {
    icon: Brain,
    number: "01",
    title: "Classify & select tool",
    description:
      "The LLM agent reads the query and decides which tool best matches the user's intent — no keyword lists, just genuine reasoning.",
  },
  {
    icon: GitMerge,
    number: "02",
    title: "Retrieve grounded context",
    description:
      "The selected tool runs the full RAG pipeline: embed → vector search → cross-encoder re-rank → extract top-N chunks.",
  },
  {
    icon: Zap,
    number: "03",
    title: "Generate & trace",
    description:
      "The LLM synthesizes a final answer from the retrieved context. Every tool call, input, and output is recorded in the trace.",
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default">Agent Orchestration</Badge>
          <Badge variant="secondary">GPT-4o-mini · Tool Calling</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Multi-Agent Architecture
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl leading-relaxed">
          Instead of keyword-based routing, this system uses genuine LLM function calling.
          The agent reads your query, reasons about intent, selects the right tool, runs
          the full RAG pipeline, and returns an answer — with a complete step-by-step trace.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link href="/query">
              <MessageSquare className="h-4 w-4" />
              Try the agent
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* ── How it works ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="mb-12"
      >
        <h2 className="text-sm font-semibold text-foreground mb-5">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.number} className="relative flex gap-4">
                {/* Connector line (between steps) */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(100%-0.5rem)] w-full h-px bg-border z-0" />
                )}
                <Card className="flex-1 relative z-10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 border border-primary/12">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xl font-bold text-muted/60 tabular-nums">
                        {s.number}
                      </span>
                    </div>
                    <CardTitle className="text-sm">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Pipeline visual ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-sm font-semibold text-foreground mb-4">Request flow</h2>
        <div className="rounded-2xl border border-border bg-muted/30 p-5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max text-xs font-medium">
            {[
              { label: "User Query", color: "bg-zinc-100 border-zinc-300 text-zinc-700" },
              { label: "Security Check", color: "bg-red-50 border-red-200 text-red-700" },
              { label: "LLM Agent", color: "bg-primary/10 border-primary/25 text-primary" },
              { label: "Tool Execution", color: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "RAG Pipeline", color: "bg-violet-50 border-violet-200 text-violet-700" },
              { label: "LLM Generation", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
              { label: "PII Redaction", color: "bg-orange-50 border-orange-200 text-orange-700" },
              { label: "Response + Trace", color: "bg-zinc-100 border-zinc-300 text-zinc-700" },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex items-center gap-2">
                <div className={cn("rounded-full border px-3 py-1.5 whitespace-nowrap", node.color)}>
                  {node.label}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Tool cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-5">Available tools</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Card className="h-full hover:shadow-card-hover transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", tool.bg)}>
                        <Icon className={cn("h-4.5 w-4.5", tool.color)} />
                      </div>
                      <div>
                        <Badge variant={tool.variant}>{tool.label}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-mono text-muted-foreground">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed mt-1">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-lg bg-muted/60 border border-border px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                        When to use
                      </p>
                      <p className="text-xs text-muted-foreground">{tool.when}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 border border-border px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                        Example
                      </p>
                      <p className="text-xs text-foreground font-medium">{tool.example}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>top_k: <strong className="text-foreground">{tool.topK}</strong></span>
                      <span>·</span>
                      <span>top_n: <strong className="text-foreground">{tool.topN}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="mt-12 rounded-2xl border border-primary/15 bg-primary/4 px-6 py-6 flex items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            Ready to see the agent in action?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Open the chat, ask any question, and expand the agent trace to see every step.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/query">
            Open Chat
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
