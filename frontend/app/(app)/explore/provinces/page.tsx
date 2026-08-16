import { Header } from "@/components/Header";
import { ListPill } from "@/components/ListPill";
import { SectionTitleRow } from "@/components/SectionTitleRow";
import { HeadphonesIcon } from "@/components/icons";
import { PROVINCES } from "@/lib/data";

/**
 * Reached either directly (Explore tab, before a Provinces link is wired
 * back in) or via a genre pick (Music category -> Genres -> here) — the
 * optional ?genre= carries that pick through to the Towns page so the
 * Genre -> Province -> Town flow reads as one continuous drill-down.
 */
export default function ProvincesPage({ searchParams }: { searchParams: { genre?: string } }) {
  const genre = searchParams.genre;

  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={HeadphonesIcon} title="Provinces" />
        {genre ? (
          <p className="text-textHeading font-heading font-semibold mb-4 -mt-2">
            Showing {genre} artists — pick a province
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          {PROVINCES.map((province) => (
            <ListPill
              key={province}
              label={province}
              href={`/explore/provinces/${encodeURIComponent(province)}${
                genre ? `?genre=${encodeURIComponent(genre)}` : ""
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
