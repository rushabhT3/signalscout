import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Log in to your SignalScout dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
        <p className="mt-5 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
