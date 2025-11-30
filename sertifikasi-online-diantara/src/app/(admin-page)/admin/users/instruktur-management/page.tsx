"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ClientOnly from "@/components/ClientOnly";
import { Suspense } from "react";
import { InstrukturManagementTable } from "@/components/Tables/Admin/InstrukturManagementTable";


interface Props {
  params: Promise<{}>
  searchParams: Promise<{}>
}

export default function InstrukturManagementPage() {
  return (
    <>
      <Breadcrumb
        mainMenu="Users Management"
        pageName="Instruktur Management"
      />
      <div className="space-y-10">
        <ClientOnly>
          <Suspense>
            <InstrukturManagementTable />
          </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
