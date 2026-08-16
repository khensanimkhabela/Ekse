"use client";

import { useState } from "react";
import type { Post } from "@/lib/data";
import { ShareIcon } from "./icons";

/** Native share sheet where available (mobile browsers), clipboard-copy
 * fallback otherwise — used by both PostCard (feed) and the post detail page. */
export function ShareButton({ post, className = "" }: { post: Post; className?: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    const shareData = { title: `${post.name} on Ekse`, text: post.caption, url };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Link copied!");
    } catch {
      setFeedback("Couldn't copy link");
    }
    setTimeout(() => setFeedback(null), 1800);
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <button type="button" onClick={handleShare} aria-label="Share" className="active:scale-95 transition-transform">
        <ShareIcon className="w-6 h-6 text-textBody" />
      </button>
      {feedback ? (
        <span className="absolute left-8 top-0 text-xs font-semibold text-primary whitespace-nowrap">{feedback}</span>
      ) : null}
    </div>
  );
}
