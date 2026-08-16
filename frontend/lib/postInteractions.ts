/**
 * Client-side like/comment state for the Home feed's Instagram-style post
 * cards. There's no backend `posts`/`comments` table yet (see README), so
 * this is a genuinely-working demo interaction layer — persisted to
 * localStorage (not just in-memory) so it stays consistent between the
 * Home feed's PostCard and the post detail/comments screen, and survives
 * navigating away and back within the same browser.
 */
import type { SeedComment } from "./data";

const LIKES_KEY = "fimiya_post_likes";
const COMMENTS_KEY_PREFIX = "fimiya_post_comments_";

function readLikeMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function isLiked(postId: string): boolean {
  return !!readLikeMap()[postId];
}

/** Flips the like state for a post and returns the new value. */
export function toggleLike(postId: string): boolean {
  const map = readLikeMap();
  map[postId] = !map[postId];
  localStorage.setItem(LIKES_KEY, JSON.stringify(map));
  return map[postId];
}

export function getUserComments(postId: string): SeedComment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY_PREFIX + postId) ?? "[]");
  } catch {
    return [];
  }
}

export function addUserComment(postId: string, comment: SeedComment): void {
  const existing = getUserComments(postId);
  existing.push(comment);
  localStorage.setItem(COMMENTS_KEY_PREFIX + postId, JSON.stringify(existing));
}
