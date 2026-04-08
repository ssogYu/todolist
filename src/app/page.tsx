"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }

    if (status === "guest") {
      router.replace("/login");
    }
  }, [router, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <Spinner />
    </div>
  );
}
