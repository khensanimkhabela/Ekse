"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BackArrowIcon, SendIcon } from "@/components/icons";
import { sendChatMessage } from "@/lib/api";
import { getToken } from "@/lib/auth";

type ChatMessage = { role: "user" | "assistant"; text: string };

const GREETING: ChatMessage = {
  role: "assistant",
  text: "Hi! I'm your Ekse assistant — ask me about your bookings, this week's featured artist, or events happening near you.",
};

/**
 * AI Chat Assistant — calls backend/routers/chat.py, which delegates
 * intent classification + reply composition to ai-services (see that
 * router's docstring). Reached via the floating chat button on every
 * (app) screen (components/ChatFab.tsx).
 */
export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const token = getToken();
      if (!token) throw new Error("Not signed in");
      const res = await sendChatMessage(text, token);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry, I couldn't reach the assistant just now — try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
        <Link href="/profile" aria-label="Back to profile" className="text-white shrink-0">
          <BackArrowIcon className="w-6 h-6" />
        </Link>
        <h1 className="flex-1 text-center font-heading font-bold text-white text-lg">Ekse Assistant</h1>
        <div className="w-6 shrink-0" aria-hidden />
      </header>

      <div className="px-4 pt-5 flex flex-col gap-3">
        <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-tile px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "self-end bg-primary text-white"
                  : "self-start bg-surface text-textBody shadow-sm"
              }`}
            >
              {m.text}
            </div>
          ))}
          {sending ? (
            <div className="self-start bg-surface text-textPlaceholder shadow-sm rounded-tile px-4 py-2.5 text-sm">
              …
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 bg-surface rounded-pill px-2 py-2 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about bookings, artist of the week…"
            className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-textPlaceholder"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <SendIcon className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </main>
  );
}
