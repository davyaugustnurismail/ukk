"use client";
import React from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";
import SertifikatTable from "@/components/Tables/Admin/SertifikatTable";


interface Props {
  params: Promise<{}>
  searchParams: Promise<{}>
}

const page = () => {
  return (
    <div>
      <>
        <Breadcrumb mainMenu="Sertifikat" pageName="Sertifikat Template" />
        <div className="space-y-10">
          <ClientOnly>
          <Suspense>
            <SertifikatTable />
          </Suspense>
          </ClientOnly>
        </div>
      </>
    </div>
  );
};

export default page;
