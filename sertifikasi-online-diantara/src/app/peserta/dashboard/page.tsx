"use client";
import React from "react";
import ClientOnly from "@/components/ClientOnly";
import DashboardPage from "@/components/Tables/Peserta/DashboardPeserta/page";

const DashboardPesertaWrapper = () => {
  return (
    <ClientOnly>
      <DashboardPage />
    </ClientOnly>
  );
};

export default DashboardPesertaWrapper;
