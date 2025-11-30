import Link from "next/link";
import SigninWithPassword from "../../SigninWithPassword/SigninWithPasswordInstruktur";
import ClientOnly from "@/components/ClientOnly";
import { Suspense } from "react";

export default function Signin() {
  return (
    <>
      <div className="my-6 flex items-center justify-center">
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
        <div className="block w-full min-w-fit bg-white px-3 text-center font-medium dark:bg-gray-dark">
          Instruktur
        </div>
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
      </div>

      <div>
        <ClientOnly>
          <Suspense>
            <SigninWithPassword />
          </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
