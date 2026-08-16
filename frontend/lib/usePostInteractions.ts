"use client";

import { useCallback, useEffect, useState } from "react";
import { COMMENTS_BY_POST, type Post } from "./data";
import { getUserComments, isLiked, toggleLike } from "./postInteractions";

/** Shared like/comment-count state for a post — used by both PostCard
 * (Home feed) and the post detail/comments screen, backed by
 * lib/postInteractions.ts's localStorage persistence so both stay in sync. */
export function usePostInteractions(post: Post) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.initialLikes);
  const [commentCount, setCommentCount] = useState((COMMENTS_BY_POST[post.id] ?? []).length);

  const refreshCommentCount = useCallback(() => {
    setCommentCount((COMMENTS_BY_POST[post.id] ?? []).length + getUserComments(post.id).length);
  }, [post.id]);

  useEffect(() => {
    const likedNow = isLiked(post.id);
    setLiked(likedNow);
    setLikeCount(post.initialLikes + (likedNow ? 1 : 0));
    refreshCommentCount();
  }, [post.id, post.initialLikes, refreshCommentCount]);

  function handleLike() {
    const newLiked = toggleLike(post.id);
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
  }

  return { liked, likeCount, commentCount, handleLike, refreshCommentCount };
}
