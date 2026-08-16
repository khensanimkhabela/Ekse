import { AuthGuard } from "@/components/AuthGuard";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ChatFab } from "@/components/ChatFab";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell pb-28">
      <AuthGuard>
        {children}
        <ChatFab />
        <BottomTabBar />
      </AuthGuard>
    </div>
  );
}
