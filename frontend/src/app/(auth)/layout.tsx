import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Logo className="size-7" />
        <Wordmark className="text-lg" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
