"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackArrowIcon, EditIcon, TargetIcon } from "@/components/icons";
import { clearSession, getToken, getStoredUser, type AuthUser } from "@/lib/auth";
import { getWallet, type Wallet } from "@/lib/api";
import { getRevenueGoal, setRevenueGoal } from "@/lib/walletGoal";

function formatZar(amount: number): string {
  return `R${Math.round(amount).toLocaleString("en-ZA")}`;
}

function formatDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime())
    ? dateStr
    : parsed.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
  released: "Paid out",
  held_in_escrow: "In escrow",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-card p-4 shadow-sm">
      <p className="text-textBody/60 text-xs font-heading font-semibold">{label}</p>
      <p className="text-textBody text-xl font-heading font-extrabold mt-0.5">{value}</p>
    </div>
  );
}

/**
 * Wallet — a simple artist earnings summary: real payments-ledger totals
 * (backend/routers/wallet.py) plus a live AI Tax Assistant estimate, and a
 * personal revenue goal (lib/walletGoal.ts — a preference, not backend
 * data). Kept deliberately plain: one stat grid, one progress bar, one
 * transaction list — no reference screen for this exists in
 * /design-reference.
 */
export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not-artist" | "error">("loading");
  const [goal, setGoal] = useState<number>(50_000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (!stored) return;
    setGoal(getRevenueGoal(stored.id));

    if (stored.role !== "artist") {
      setStatus("not-artist");
      return;
    }
    const token = getToken();
    if (!token) {
      setStatus("error");
      return;
    }
    getWallet(token).then((result) => {
      if (result.status === "unauthorized") {
        // Saved session no longer matches a real user (e.g. the demo DB
        // was rebuilt since this browser logged in) — send them to sign
        // in again instead of leaving a dead "couldn't load" screen.
        clearSession();
        router.push("/login");
        return;
      }
      setStatus(result.status);
      if (result.wallet) setWallet(result.wallet);
    });
  }, [router]);

  function saveGoal() {
    if (!user) return;
    const amount = Number(goalDraft);
    if (!amount || amount <= 0) return;
    setRevenueGoal(user.id, amount);
    setGoal(amount);
    setEditingGoal(false);
  }

  const goalPct = wallet ? Math.min(100, Math.round((wallet.earned_zar / goal) * 100)) : 0;

  return (
    <main>
      <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
        <button type="button" onClick={() => router.push("/profile")} aria-label="Back" className="text-white shrink-0">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-heading font-bold text-white text-lg">Wallet</h1>
        <div className="w-6 shrink-0" aria-hidden />
      </header>

      <div className="px-4 pt-5 pb-4 flex flex-col gap-4">
        {status === "not-artist" ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            Wallet is for artist accounts — organizers manage payments from the Bookings flow.
          </p>
        ) : status === "error" ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            Couldn&apos;t load your wallet right now — make sure the backend API is running.
          </p>
        ) : status === "loading" || !wallet ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">Loading…</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Revenue" value={formatZar(wallet.total_revenue_zar)} />
              <StatCard label="Earned" value={formatZar(wallet.earned_zar)} />
              <StatCard label="Pending" value={formatZar(wallet.pending_zar)} />
              <StatCard label="Due to SARS" value={formatZar(wallet.estimated_tax_zar)} />
            </div>

            {/* Goal */}
            <div className="bg-surface rounded-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TargetIcon className="w-5 h-5 text-primary" />
                  <p className="font-heading font-bold text-textBody">Revenue Goal</p>
                </div>
                {!editingGoal ? (
                  <button
                    type="button"
                    onClick={() => {
                      setGoalDraft(String(goal));
                      setEditingGoal(true);
                    }}
                    aria-label="Edit revenue goal"
                    className="text-primary"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    autoFocus
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    className="flex-1 bg-inputFill rounded-pill px-4 py-2 text-sm outline-none"
                  />
                  <button type="button" onClick={saveGoal} className="bg-primary text-white text-sm font-heading font-bold rounded-pill px-4 py-2">
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-textBody/80 mb-2">
                    {formatZar(wallet.earned_zar)} of {formatZar(goal)} ({goalPct}%)
                  </p>
                  <div className="h-3 bg-inputFill rounded-pill overflow-hidden">
                    <div className="h-full bg-primary rounded-pill" style={{ width: `${goalPct}%` }} />
                  </div>
                </>
              )}
            </div>

            {/* Recent transactions */}
            <div>
              <p className="font-heading font-bold text-xl text-textHeading mb-3">Recent Transactions</p>
              {wallet.transactions.length === 0 ? (
                <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
                  No transactions yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {wallet.transactions.map((t) => (
                    <div key={t.id} className="bg-surface rounded-card p-3 flex items-center justify-between gap-3 shadow-sm">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm text-textBody truncate">{t.event_title}</p>
                        <p className="text-xs text-textBody/60">
                          {formatDate(t.date)} · {STATUS_LABELS[t.status] ?? t.status}
                        </p>
                      </div>
                      <p className="font-heading font-bold text-textBody shrink-0">{formatZar(t.amount_zar)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
