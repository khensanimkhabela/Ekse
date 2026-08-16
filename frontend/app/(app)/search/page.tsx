import { ArtistCard } from "@/components/ArtistCard";
import { Header } from "@/components/Header";
import { SectionTitleRow } from "@/components/SectionTitleRow";
import { SearchIcon } from "@/components/icons";
import { searchArtists } from "@/lib/api";

// Depends on the backend, and on the live query string — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = (searchParams.q ?? "").trim();
  const { artists, error } = query ? await searchArtists(query) : { artists: [], error: false };

  return (
    <main>
      <Header initialQuery={query} />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={SearchIcon} title="Search" />

        {!query ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            Search for an artist by name, genre, town or category.
          </p>
        ) : error ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            Couldn&apos;t search right now — make sure the backend API is running.
          </p>
        ) : (
          <>
            <p className="text-textHeading font-heading font-semibold mb-4 -mt-2">
              {artists.length} result{artists.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </p>
            {artists.length === 0 ? (
              <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
                No artists matched &ldquo;{query}&rdquo; — try a different name, genre or town.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
