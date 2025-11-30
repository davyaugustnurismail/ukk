'use client';
import React from "react";
import ClientOnly from "@/components/ClientOnly";
import DashboardAdmin from "@/components/Tables/Admin/DashboardAdmin";

const dashboardAdminPage = () => {
    return (
        <ClientOnly>
            <DashboardAdmin />
        </ClientOnly>
    )
}

export default dashboardAdminPage;