import { AssistantBanner } from "@/components/AssistantBanner";
import { Header } from "@/components/Header";
import { HamburgerIcon } from "@/components/icons";
import { PostCard } from "@/components/PostCard";
import { StoriesRow } from "@/components/StoriesRow";
import { POSTS } from "@/lib/data";

const CURRENT_USER_AVATAR = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80";

export default function HomePage() {
  return (
    <main>
      <Header avatarUrl={CURRENT_USER_AVATAR} />

      <div className="px-4 pt-5">
        <AssistantBanner />

        <div className="flex items-center justify-between mt-5 mb-3">
          <h2 className="font-heading font-bold text-2xl text-textHeading">Stories</h2>
          <HamburgerIcon className="w-6 h-6 text-primary" />
        </div>
        <StoriesRow />

        <h2 className="font-heading font-bold text-2xl text-textHeading mt-6 mb-3">Posts</h2>
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
