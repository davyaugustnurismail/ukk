"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DashboardInstruktur } from "@/components/Tables/Instruktur/DashboardInstruktur/page";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import ClientOnly from "@/components/ClientOnly";
import { Suspense } from "react";

export default function ActivityManagement() {
  return (
    <>
      <Breadcrumb mainMenu="Dashboard" pageName="Activity" />

      <div className="space-y-10">
        <ClientOnly>
          <Suspense fallback={<TopChannelsSkeleton />}>
            <DashboardInstruktur />
          </Suspense>
        </ClientOnly>
      </div>
    </>
  );
}
