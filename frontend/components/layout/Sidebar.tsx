"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Upload,
  BookOpen,
  Zap,
  X,
  Menu,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Chat",
    href: "/query",
    icon: MessageSquare,
  },
  {
    label: "Agents",
    href: "/agents",
    icon: Bot,
  },
  {
    label: "Ingest",
    href: "/ingest",
    icon: Upload,
  },
];

const bottomItems = [
  {
    label: "Docs",
    href: "https://github.com/virtualryder/genai-production-starter-kit",
    icon: BookOpen,
    external: true,
  },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  external,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  external?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-sidebar-active text-sidebar-text-active"
          : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-sidebar-text-active" : "text-sidebar-text group-hover:text-sidebar-text-active"
        )}
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-text-active leading-tight">
            GenAI Kit
          </p>
          <p className="text-[10px] text-sidebar-text leading-tight mt-0.5">
            Production Starter
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/60">
          Product
        </p>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-0.5">
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={false}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar-bg border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-sidebar-text-active">
            GenAI Kit
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-sidebar-bg border-r border-sidebar-border"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
