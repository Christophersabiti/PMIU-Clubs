"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { btn } from "@/components/ui";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`${btn.base} ${btn.light} ${btn.sm}`}
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) await navigator.share({ title, url }).catch(() => {});
        else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      }}
    >
      <Share2 className="h-4 w-4" aria-hidden /> {copied ? "Link copied" : "Share"}
    </button>
  );
}
