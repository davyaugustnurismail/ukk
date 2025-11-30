import Signin from "@/components/Auth/Admin/Signin";
import ClientOnly from "@/components/ClientOnly";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In Admin",
};

export default function SignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800 dark:shadow-md">
        <ClientOnly>
          <Signin />
        </ClientOnly>
      </div>
    </main>
  );
}
