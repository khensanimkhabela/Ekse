import type { ApiArtist } from "@/lib/api";
import { StarRating } from "./StarRating";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Local-artist result card for the Town Artists screen. No reference
 * screen for this exists in /design-reference, so it's built from the
 * same tokens as the rest of the app (white card, blue accents, rounded
 * shapes) rather than a new pattern.
 */
export function ArtistCard({ artist }: { artist: ApiArtist }) {
  return (
    <div className="bg-surface rounded-card p-4 flex gap-3 items-center shadow-sm">
      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span className="text-white font-heading font-bold text-lg">{initials(artist.stage_name)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold text-textBody truncate">{artist.stage_name}</p>
        <p className="text-xs text-primary font-semibold capitalize truncate">
          {artist.category}
          {artist.genres ? ` • ${artist.genres}` : ""}
        </p>
        <div className="mt-1">
          <StarRating score={artist.reputation_score} showValue />
        </div>
        {artist.bio ? <p className="text-xs text-textBody/70 mt-1 line-clamp-2">{artist.bio}</p> : null}
      </div>
    </div>
  );
}
