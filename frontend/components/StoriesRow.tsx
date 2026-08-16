import Image from "next/image";
import { STORIES } from "@/lib/data";

/**
 * Auto-sliding "stories" row — continuously slides left like a slideshow
 * (see the .stories-track keyframes in app/globals.css), pausing on hover,
 * with each thumbnail zooming in on hover. The list is rendered twice
 * back-to-back so the loop is seamless — pure CSS, no JS/client component
 * needed. Each thumbnail carries the poster's name at the bottom, over a
 * gradient scrim for legibility — the Instagram-style story-tray look.
 */
export function StoriesRow() {
  const loopedStories = [...STORIES, ...STORIES];

  return (
    <div className="overflow-hidden">
      <div className="stories-track flex gap-3 w-max pb-1">
        {loopedStories.map((story, i) => (
          <div
            key={`${story.id}-${i}`}
            aria-hidden={i >= STORIES.length}
            className="relative w-24 h-32 rounded-tile overflow-hidden shrink-0 bg-primary/20 transition-transform duration-300 ease-out hover:scale-110 hover:z-10 hover:shadow-lg"
          >
            <Image src={story.image} alt="" fill sizes="96px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
            <p className="absolute bottom-1.5 inset-x-1.5 text-white text-[11px] font-heading font-bold leading-tight truncate">
              {story.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
