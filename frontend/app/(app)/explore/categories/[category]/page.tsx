import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ListPill } from "@/components/ListPill";
import { SectionTitleRow } from "@/components/SectionTitleRow";
import { CATEGORY_ICONS, HeadphonesIcon } from "@/components/icons";
import { CATEGORIES, GENRES } from "@/lib/data";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.toLowerCase() }));
}

export default function CategoryDetailPage({ params }: { params: { category: string } }) {
  const category = CATEGORIES.find((c) => c.toLowerCase() === params.category.toLowerCase());
  if (!category) notFound();

  // Only "Music" has a dedicated Genres screen in the design reference
  // (design-reference/42c50120-genre_view.png); other categories fall back
  // to a simple artist-listing placeholder — noted as an assumption.
  if (category === "Music") {
    return (
      <main>
        <Header />
        <div className="px-4 pt-5">
          <SectionTitleRow icon={HeadphonesIcon} title="Genres" />
          <div className="flex flex-col gap-3">
            {GENRES.map((genre) => (
              <ListPill
                key={genre}
                label={genre}
                href={`/explore/provinces?genre=${encodeURIComponent(genre)}`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const Icon = CATEGORY_ICONS[category];
  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={Icon} title={category} />
        <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
          No {category.toLowerCase()} artists in this area yet — check back soon.
        </p>
      </div>
    </main>
  );
}
