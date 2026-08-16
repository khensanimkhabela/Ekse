import type { ComponentType } from "react";
import { HamburgerIcon } from "./icons";

/**
 * Section title row — blue rounded-square icon tile + bold blue title +
 * hamburger icon on the right. Used for Provinces / Towns / Genres /
 * Categories headings.
 */
export function SectionTitleRow({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-tile bg-primary flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-textHeading">{title}</h1>
      </div>
      <HamburgerIcon className="w-6 h-6 text-primary" />
    </div>
  );
}
