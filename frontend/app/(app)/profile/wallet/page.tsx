"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackArrowIcon, EditIcon, TargetIcon } from "@/components/icons";
import { getToken, getStoredUser, type AuthUser } from "@/lib/auth";
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

function daysUntil(dateStr: string): number | null {
  const parsed = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATUS_STYLES: Record<string, string> = {
  released: "bg-green-100 text-green-700",
  held_in_escrow: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  refunded: "bg-red-100 text-red-600",
  failed: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  released: "Paid out",
  held_in_escrow: "In escrow",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

/**
 * Wallet — an artist's earnings dashboard: real payments-ledger totals
 * (backend/routers/wallet.py) plus a live AI Tax Assistant estimate fed
 * by those real earnings, and a personal revenue goal (see
 * lib/walletGoal.ts — a preference, not backend data). No reference
 * screen for this exists in /design-reference.
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
      setStatus(result.status);
      if (result.wallet) setWallet(result.wallet);
    });
  }, []);

  function saveGoal() {
    if (!user) return;
    const amount = Number(goalDraft);
    if (!amount || amount <= 0) return;
    setRevenueGoal(user.id, amount);
    setGoal(amount);
    setEditingGoal(false);
  }

  const earnedPct = wallet ? Math.min(100, (wallet.earned_zar / goal) * 100) : 0;
  const totalPct = wallet ? Math.min(100, (wallet.total_revenue_zar / goal) * 100) : 0;
  const filingDays = wallet ? daysUntil(wallet.sars_filing_due) : null;

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
            {/* Total revenue hero */}
            <div className="bg-primary rounded-card px-5 py-5 shadow-sm">
              <p className="text-white/80 text-sm font-heading font-semibold">Total Revenue</p>
              <p className="text-white text-3xl font-heading font-extrabold mt-1">{formatZar(wallet.total_revenue_zar)}</p>
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="text-white/70 text-xs">Earned</p>
                  <p className="text-white font-heading font-bold">{formatZar(wallet.earned_zar)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Pending</p>
                  <p className="text-white font-heading font-bold">{formatZar(wallet.pending_zar)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Completed gigs</p>
                  <p className="text-white font-heading font-bold">{wallet.completed_bookings}</p>
                </div>
              </div>
            </div>

            {/* Revenue goal */}
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
                    {formatZar(wallet.earned_zar)} of {formatZar(goal)} goal ({Math.round(earnedPct)}%)
                  </p>
                  <div className="relative h-3 bg-inputFill rounded-pill overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-primary/30 rounded-pill" style={{ width: `${totalPct}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-primary rounded-pill" style={{ width: `${earnedPct}%` }} />
                  </div>
                  {wallet.pending_zar > 0 ? (
                    <p className="text-xs text-textBody/60 mt-1.5">
                      + {formatZar(wallet.pending_zar)} pending would put you at {Math.round(totalPct)}%
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {/* SARS / tax */}
            <div className="bg-surface rounded-card p-4 shadow-sm">
              <p className="font-heading font-bold text-textBody mb-2">Due to SARS</p>
              <p className="text-2xl font-heading font-extrabold text-textBody">{formatZar(wallet.estimated_tax_zar)}</p>
              <p className="text-xs text-textBody/60 mt-1">
                Estimated on {formatZar(wallet.taxable_income_zar)} taxable income · {wallet.effective_tax_rate_pct}% effective rate
              </p>
              <p className="text-sm text-textBody/80 mt-2">
                Filing due {formatDate(wallet.sars_filing_due)}
                {filingDays != null ? ` · ${filingDays >= 0 ? `${filingDays} days left` : "overdue"}` : ""}
              </p>
              <p className="text-[11px] text-textBody/50 mt-2">Estimated by Fimiya&apos;s AI Tax Assistant — not filed tax advice.</p>
            </div>

            {/* Recent transactions */}
            <div>
              <p className="font-heading font-bold text-xl text-textHeading mb-3">Recent Transactions</p>
              {wallet.transactions.length === 0 ? (
                <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
                  No transactions yet — booked gigs will show up here.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {wallet.transactions.map((t) => (
                    <div key={t.id} className="bg-surface rounded-card p-3.5 flex items-center justify-between gap-3 shadow-sm">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm text-textBody truncate">{t.event_title}</p>
                        <p className="text-xs text-textBody/60">{formatDate(t.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-textBody">{formatZar(t.amount_zar)}</p>
                        <span className={`text-[11px] font-heading font-bold rounded-pill px-2 py-0.5 ${STATUS_STYLES[t.status] ?? ""}`}>
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                      </div>
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
