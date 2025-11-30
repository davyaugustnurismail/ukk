import { Suspense } from "react";
import ResetPasswordClient from "@/components/Auth/Peserta/resetPassword";

export const dynamic = "force-dynamic"; // hindari prerender error saat build

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-green-700">Memuat…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
