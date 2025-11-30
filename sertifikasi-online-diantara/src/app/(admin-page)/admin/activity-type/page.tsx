"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Suspense } from "react";
import ActivityType from "@/components/Tables/Admin/ActivityType";
import ClientOnly from "@/components/ClientOnly";

export default function ActivityManagementPage() {
  return (
    <>
      <Breadcrumb mainMenu="Activity" pageName="Activity Types" />
      <div className="space-y-10">
        <ClientOnly>
          <Suspense>
            <ActivityType />
          </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
