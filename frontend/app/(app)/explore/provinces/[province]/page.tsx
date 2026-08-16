import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ListPill } from "@/components/ListPill";
import { SectionTitleRow } from "@/components/SectionTitleRow";
import { HeadphonesIcon } from "@/components/icons";
import { PROVINCES, TOWNS_BY_PROVINCE, type Province } from "@/lib/data";

export function generateStaticParams() {
  return PROVINCES.map((province) => ({ province }));
}

export default function TownsPage({
  params,
  searchParams,
}: {
  params: { province: string };
  searchParams: { genre?: string };
}) {
  const province = decodeURIComponent(params.province) as Province;
  const towns = TOWNS_BY_PROVINCE[province];
  if (!towns) notFound();
  const genre = searchParams.genre;

  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={HeadphonesIcon} title="Towns" />
        {genre ? (
          <p className="text-textHeading font-heading font-semibold mb-4 -mt-2">
            {genre} artists in {province}
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          {towns.map((town) => (
            <ListPill
              key={town}
              label={town}
              href={`/explore/provinces/${encodeURIComponent(province)}/${encodeURIComponent(town)}${
                genre ? `?genre=${encodeURIComponent(genre)}` : ""
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
