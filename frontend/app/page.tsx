"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Upload,
  Shield,
  GitBranch,
  Layers,
  Database,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Layers,
    title: "RAG Pipeline",
    description:
      "Semantic retrieval with cross-encoder re-ranking and context compression to maximize answer quality.",
    badge: "Core",
    badgeVariant: "retrieval" as const,
  },
  {
    icon: GitBranch,
    title: "Intent Routing",
    description:
      "Agent-based routing directs queries to retrieval, summarization, or action extraction workflows.",
    badge: "Agent",
    badgeVariant: "summarization" as const,
  },
  {
    icon: Shield,
    title: "Security Guardrails",
    description:
      "Prompt injection detection and PII redaction applied automatically on every request.",
    badge: "Security",
    badgeVariant: "action_extraction" as const,
  },
  {
    icon: Database,
    title: "pgvector Store",
    description:
      "Persistent vector storage via PostgreSQL + pgvector — no additional infrastructure needed.",
    badge: "Storage",
    badgeVariant: "default" as const,
  },
];

const steps = [
  {
    step: "01",
    title: "Add your documents",
    description: "Paste policy docs, knowledge base articles, or any text.",
    href: "/ingest",
    cta: "Go to Ingest",
    icon: Upload,
  },
  {
    step: "02",
    title: "Ask a question",
    description: "Query your knowledge base in natural language.",
    href: "/query",
    cta: "Go to Query",
    icon: MessageSquare,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
};

export default function DashboardPage() {
  return (
    <div className="min-h-full px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="success">Live</Badge>
          <span className="text-xs text-muted-foreground">
            API connected · RAG pipeline ready
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          GenAI Production Starter Kit
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          A production-ready RAG pipeline with security guardrails, re-ranking,
          and agent routing — deployed on Railway.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button asChild>
            <Link href="/query">
              <MessageSquare className="h-4 w-4" />
              Start querying
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/ingest">
              <Upload className="h-4 w-4" />
              Add documents
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Onboarding steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="mb-10"
      >
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Get started in two steps
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.step}
                className="group hover:shadow-card-hover transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 border border-primary/12">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-2xl font-bold text-muted/80 tabular-nums select-none">
                      {s.step}
                    </span>
                  </div>
                  <CardTitle className="mt-3">{s.title}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={s.href}>
                      {s.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Features */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">
          What&apos;s included
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <Badge variant={f.badgeVariant}>{f.badge}</Badge>
                    </div>
                    <CardTitle className="mt-2">{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
