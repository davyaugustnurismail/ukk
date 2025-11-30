"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";
import { PesertaManagementTable } from "@/components/Tables/Admin/PesertaManagementTable";

interface Props {
  params: Promise<{}>
  searchParams: Promise<{}>
}

export default function InstrukturManagementPage() {
  return (
    <>
      <Breadcrumb mainMenu="Users Management" pageName="Peserta Management" />
      <div className="space-y-10">
        <ClientOnly>
         <Suspense>
           <PesertaManagementTable />
         </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
