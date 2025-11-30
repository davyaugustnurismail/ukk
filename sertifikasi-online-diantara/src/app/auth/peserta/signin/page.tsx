import Signin from "@/components/Auth/Admin/Signin";
import type { Metadata } from "next";
import Peserta from "@/components/Auth/Peserta/Signin";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In Peserta & Partisipan",
};

export default function SignIn() {
  return (
    <Suspense>
        <Peserta /> 
    </Suspense>
  );
}
