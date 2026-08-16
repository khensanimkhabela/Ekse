"use client";

import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/data";
import { usePostInteractions } from "@/lib/usePostInteractions";
import { CommentIcon, HeartIcon } from "./icons";
import { ShareButton } from "./ShareButton";

/**
 * Social post card — blue header strip (avatar + name + role) sitting on
 * top of a white content panel (caption, image, then an Instagram-style
 * like/comment/share action bar). Like + comment-count state is real,
 * persisted client-side (see lib/postInteractions.ts) — there's no backend
 * `posts`/`comments` table yet, so this doesn't sync across devices, but
 * it's a genuine working interaction, not a static mock.
 */
export function PostCard({ post }: { post: Post }) {
  const { liked, likeCount, commentCount, handleLike } = usePostInteractions(post);

  return (
    <article className="rounded-card overflow-hidden shadow-sm mb-5">
      <div className="bg-primary flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 bg-white/30">
          <Image src={post.avatar} alt={post.name} fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-white leading-tight truncate">{post.name}</p>
          <p className="text-white/90 text-xs leading-tight truncate">{post.role}</p>
        </div>
      </div>
      <div className="bg-surface px-4 py-4">
        <p className="text-textBody text-sm leading-relaxed mb-3">{post.caption}</p>
        <div className="relative w-full aspect-[4/3] rounded-tile overflow-hidden">
          <Image src={post.image} alt="" fill sizes="400px" className="object-cover" />
        </div>

        <div className="flex items-center gap-5 mt-3">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <HeartIcon
              filled={liked}
              className={`w-6 h-6 transition-colors ${liked ? "text-red-500" : "text-textBody"}`}
            />
            <span className="text-sm font-semibold text-textBody">{likeCount}</span>
          </button>

          <Link href={`/post/${post.id}`} className="flex items-center gap-1.5">
            <CommentIcon className="w-6 h-6 text-textBody" />
            <span className="text-sm font-semibold text-textBody">{commentCount}</span>
          </Link>

          <ShareButton post={post} />
        </div>
      </div>
    </article>
  );
}
