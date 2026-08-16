import { ArtistCard } from "@/components/ArtistCard";
import { Header } from "@/components/Header";
import { SectionTitleRow } from "@/components/SectionTitleRow";
import { PersonIcon } from "@/components/icons";
import { getArtistsByTown } from "@/lib/api";

// Fetches live from the backend (not the local mock data the rest of
// Explore uses) — never statically prerendered, since it depends on the
// backend being up.
export const dynamic = "force-dynamic";

export default async function TownArtistsPage({
  params,
  searchParams,
}: {
  params: { province: string; town: string };
  searchParams: { genre?: string };
}) {
  const province = decodeURIComponent(params.province);
  const town = decodeURIComponent(params.town);
  const genre = searchParams.genre;

  // Show every artist local to this town — genre is context, not a hard
  // filter. Most towns only have 1-2 seeded artists (see
  // backend/db/create_demo_db.py), so AND-ing in a genre filter meant
  // almost any genre pick returned zero results for almost every town.
  // Artists matching the picked genre are surfaced first, then — within
  // each tier — the artist other organizers have rated more highly (see
  // StarRating), so the best-reviewed local artists are the easiest to spot.
  const { artists, error } = await getArtistsByTown({ town, province });
  const sortedArtists = [...artists].sort((a, b) => {
    if (genre) {
      const aMatch = (a.genres ?? "").toLowerCase().includes(genre.toLowerCase()) ? 0 : 1;
      const bMatch = (b.genres ?? "").toLowerCase().includes(genre.toLowerCase()) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return b.reputation_score - a.reputation_score;
  });

  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={PersonIcon} title={town} />
        {genre ? (
          <p className="text-textHeading font-heading font-semibold mb-4 -mt-2">
            Artists in {town} — {genre} matches shown first
          </p>
        ) : null}

        {error ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            Couldn&apos;t load artists right now — make sure the backend API is running.
          </p>
        ) : sortedArtists.length === 0 ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            No artists in {town} yet — check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
