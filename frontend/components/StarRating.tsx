import { StarIcon } from "./icons";

/**
 * Star rating display, fed by artists.reputation_score (0.00-5.00) — per
 * the AI ARCHITECTURE workflow, this is built up from organizer feedback
 * after a booking (Sentiment Analysis on post-event reviews -> reputation
 * score -> feeds back into the Recommendation Engine). Shown on the Town
 * Artists page so organizers browsing a town can see, at a glance, which
 * local artists other organizers have rated highly.
 *
 * Only the gold/amber stars earned are rendered (no muted 5-star track) —
 * the exact score is still shown as text via `showValue`.
 */
export function StarRating({
  score,
  size = "w-4 h-4",
  showValue = false,
}: {
  score: number;
  size?: string;
  showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(5, score));
  const filledCount = Math.round(clamped);

  return (
    <div className="inline-flex items-center gap-1.5" title={`${clamped.toFixed(2)} out of 5, rated by organizers`}>
      <div
        className="flex gap-1 text-amber-400"
        role="img"
        aria-label={`${clamped.toFixed(1)} out of 5 stars from organizers`}
      >
        {Array.from({ length: filledCount }).map((_, i) => (
          <StarIcon key={i} className={size} />
        ))}
      </div>
      {showValue ? <span className="text-xs font-heading font-bold text-textBody">{clamped.toFixed(1)}</span> : null}
    </div>
  );
}
