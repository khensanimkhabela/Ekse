import { Header } from "@/components/Header";
import { MessagesIcon } from "@/components/icons";
import { SectionTitleRow } from "@/components/SectionTitleRow";

// Assumption: Messages has no reference screen in /design-reference — built
// as a minimal placeholder using the same header/section-title system.
export default function MessagesPage() {
  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={MessagesIcon} title="Messages" />
        <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
          Your conversations will show up here — coming soon.
        </p>
      </div>
    </main>
  );
}
