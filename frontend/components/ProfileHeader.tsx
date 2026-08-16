import Image from "next/image";
import { HamburgerIcon } from "./icons";

/**
 * Profile header — no search bar. Circular avatar + bold name + role
 * subtitle + hamburger menu, on the primary-blue banner, per
 * design-reference/4cf922c5-artist_page.png.
 */
export function ProfileHeader({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: string;
  avatarUrl: string;
}) {
  return (
    <header className="bg-primary rounded-b-card px-5 pt-6 pb-7 flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden relative shrink-0 border-2 border-brandGreen">
        <Image src={avatarUrl} alt={name} fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-heading font-extrabold text-2xl text-white leading-tight truncate">{name}</h1>
        <p className="text-white/90 font-heading font-medium truncate">{role}</p>
      </div>
      <HamburgerIcon className="w-6 h-6 text-white shrink-0" />
    </header>
  );
}
