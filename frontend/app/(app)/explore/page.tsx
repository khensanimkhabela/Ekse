import { CategoryGrid } from "@/components/CategoryGrid";
import { Header } from "@/components/Header";
import { ListPill } from "@/components/ListPill";
import { SectionTitleRow } from "@/components/SectionTitleRow";
import { TargetIcon } from "@/components/icons";
import { EVENT_TYPES } from "@/lib/data";

export default function ExplorePage() {
  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={TargetIcon} title="Categories" />
        <CategoryGrid />

        <h2 className="font-heading font-bold text-2xl text-textHeading mb-3">Events</h2>
        <div className="flex flex-col gap-3">
          {EVENT_TYPES.map((eventType) => (
            <ListPill key={eventType} label={eventType} />
          ))}
        </div>
      </div>
    </main>
  );
}
