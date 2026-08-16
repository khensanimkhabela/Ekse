"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackArrowIcon, CommentIcon, HeartIcon, SendIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { COMMENTS_BY_POST, POSTS, type Post, type SeedComment } from "@/lib/data";
import { addUserComment, getUserComments } from "@/lib/postInteractions";
import { usePostInteractions } from "@/lib/usePostInteractions";

const DetailHeader = ({ title }: { title: string }) => (
  <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
    <Link href="/" aria-label="Back to home" className="text-white shrink-0">
      <BackArrowIcon className="w-6 h-6" />
    </Link>
    <h1 className="flex-1 text-center font-heading font-bold text-white text-lg truncate">{title}</h1>
    <div className="w-6 shrink-0" aria-hidden />
  </header>
);

/**
 * Post detail + comments — reached by tapping the comment count on a Home
 * feed PostCard. No reference screen exists for this in /design-reference,
 * built from the same tokens as the rest of the app. Comments are seeded
 * (lib/data.ts's COMMENTS_BY_POST) plus anything the user adds themselves,
 * persisted via lib/postInteractions.ts.
 */
export default function PostDetailPage({ params }: { params: { postId: string } }) {
  const post = POSTS.find((p) => p.id === params.postId);

  if (!post) {
    return (
      <main>
        <DetailHeader title="Post" />
        <p className="px-4 pt-8 text-center text-textHeading font-heading font-medium">Post not found.</p>
      </main>
    );
  }
  return <PostDetail post={post} />;
}

function PostDetail({ post }: { post: Post }) {
  const { liked, likeCount, commentCount, handleLike, refreshCommentCount } = usePostInteractions(post);
  const [comments, setComments] = useState<SeedComment[]>(COMMENTS_BY_POST[post.id] ?? []);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    setComments([...(COMMENTS_BY_POST[post.id] ?? []), ...getUserComments(post.id)]);
  }, [post.id]);

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    const comment: SeedComment = {
      id: `local-${Date.now()}`,
      author: "You",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
      text,
      timestamp: "Just now",
    };
    addUserComment(post.id, comment);
    setComments((c) => [...c, comment]);
    setCommentText("");
    refreshCommentCount();
  }

  return (
    <main>
      <DetailHeader title="Post" />

      <div className="px-4 pt-5">
        <div className="rounded-card overflow-hidden shadow-sm mb-5">
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

              <div className="flex items-center gap-1.5">
                <CommentIcon className="w-6 h-6 text-textBody" />
                <span className="text-sm font-semibold text-textBody">{commentCount}</span>
              </div>

              <ShareButton post={post} />
            </div>
          </div>
        </div>

        <h2 className="font-heading font-bold text-xl text-textHeading mb-3">
          Comments{commentCount > 0 ? ` (${commentCount})` : ""}
        </h2>

        <div className="flex flex-col gap-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
              No comments yet — be the first to say something.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-surface rounded-card p-3 flex gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full overflow-hidden relative shrink-0 bg-primary/20">
                  <Image src={c.avatar} alt={c.author} fill sizes="36px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-heading font-bold text-sm text-textBody truncate">{c.author}</p>
                    <span className="text-[11px] text-textPlaceholder shrink-0">{c.timestamp}</span>
                  </div>
                  <p className="text-sm text-textBody/90 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} className="flex items-center gap-2 bg-surface rounded-pill px-2 py-2 shadow-sm">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-textPlaceholder"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            aria-label="Post comment"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <SendIcon className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </main>
  );
}
