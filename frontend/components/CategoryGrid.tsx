import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { CATEGORY_ICONS } from "./icons";

/** 2x4 grid of square blue icon tiles with a white glyph + caption label. */
export function CategoryGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        return (
          <Link
            key={category}
            href={`/explore/categories/${category.toLowerCase()}`}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="w-full aspect-square rounded-tile bg-primary flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-heading font-semibold text-textHeading">{category}</span>
          </Link>
        );
      })}
    </div>
  );
}
