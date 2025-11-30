"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";
import ActivityManagementTable from "@/components/Tables/Admin/ActivityManagementTable";

export default function ActivityManagementPage() {
  return (
    <>
      <Breadcrumb mainMenu="Activity" pageName="Activity Management" />
      <div className="space-y-10">
        <ClientOnly>
          <Suspense>
            <ActivityManagementTable />
          </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
