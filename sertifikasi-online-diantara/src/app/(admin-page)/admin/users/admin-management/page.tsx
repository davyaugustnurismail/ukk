"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";
import AdminManagementTable from "@/components/Tables/Admin/AdminManagementTable";

interface Props {
  params: Promise<{}>
  searchParams: Promise<{}>
}

export default function AdminManagementPage() {
  return (
    <>
      <Breadcrumb mainMenu="Users Management" pageName="Admin Management" />
      <div className="space-y-10">
        <ClientOnly>
        <Suspense>
          <AdminManagementTable />
        </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
