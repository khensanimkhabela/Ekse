"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackArrowIcon, ImageIcon } from "@/components/icons";

/**
 * Create Post — reached from the Profile menu's "Create new post" pill.
 * No reference screen exists for this in /design-reference, so it's built
 * from the same tokens/shapes as the rest of the app (rounded-bottom blue
 * banner, white rounded card, pill-style inputs).
 *
 * Demo only: there's no backend `posts` endpoint yet (backend's
 * `portfolios` table — title/caption/media_url/media_type — is the
 * natural home for this once wired up), so submitting here just confirms
 * and returns to the feed rather than persisting anywhere.
 */
export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    // Demo only — see file docstring.
    setTimeout(() => router.push("/"), 500);
  }

  const canPost = (caption.trim().length > 0 || imagePreview) && !posting;

  return (
    <main>
      <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
        <Link href="/profile" aria-label="Back to profile" className="text-white shrink-0">
          <BackArrowIcon className="w-6 h-6" />
        </Link>
        <h1 className="flex-1 text-center font-heading font-bold text-white text-lg">Create Post</h1>
        <div className="w-6 shrink-0" aria-hidden />
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-5 flex flex-col gap-4">
        <label className="relative w-full aspect-[4/3] rounded-card border-2 border-dashed border-primary/40 bg-surface flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer">
          {imagePreview ? (
            <Image src={imagePreview} alt="Post preview" fill className="object-cover" unoptimized />
          ) : (
            <>
              <ImageIcon className="w-9 h-9 text-primary" />
              <span className="text-sm text-textPlaceholder font-medium">Add a photo</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption…"
          rows={4}
          className="w-full bg-inputFill rounded-tile px-4 py-3 text-sm outline-none resize-none placeholder:text-textPlaceholder"
        />

        <button
          type="submit"
          disabled={!canPost}
          className="w-full bg-primary text-white font-heading font-bold text-lg rounded-pill py-3.5 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </form>
    </main>
  );
}
