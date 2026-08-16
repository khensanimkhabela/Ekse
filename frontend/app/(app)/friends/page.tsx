import { Header } from "@/components/Header";
import { FriendsIcon } from "@/components/icons";
import { SectionTitleRow } from "@/components/SectionTitleRow";

// Assumption: Friends has no reference screen in /design-reference — built
// as a minimal placeholder using the same header/section-title system.
export default function FriendsPage() {
  return (
    <main>
      <Header />
      <div className="px-4 pt-5">
        <SectionTitleRow icon={FriendsIcon} title="Friends" />
        <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
          Connect with other artists and organizers — coming soon.
        </p>
      </div>
    </main>
  );
}
