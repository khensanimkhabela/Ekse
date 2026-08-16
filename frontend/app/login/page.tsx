import { Logo } from "@/components/Logo";
import { LoginCard } from "@/components/LoginCard";

export default function LoginPage() {
  return (
    <main className="app-shell !bg-brandGreen flex flex-col">
      <div className="flex-1 flex items-center justify-center pt-16 pb-4">
        <Logo />
      </div>
      <LoginCard />
      <div className="h-10" />
    </main>
  );
}
