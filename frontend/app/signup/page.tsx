import { Logo } from "@/components/Logo";
import { SignupCard } from "@/components/SignupCard";

export default function SignupPage() {
  return (
    <main className="app-shell !bg-brandGreen flex flex-col">
      <div className="flex-1 flex items-center justify-center pt-12 pb-4">
        <Logo size={180} />
      </div>
      <SignupCard />
      <div className="h-10" />
    </main>
  );
}
