"use client";

import ClientOnly from "@/components/ClientOnly";
import { Header } from "@/components/Layouts/Admin/header";
import { Sidebar } from "@/components/Layouts/Admin/sidebar";
import { SidebarProvider } from "@/components/Layouts/Admin/sidebar/sidebar-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header />
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
    </ClientOnly>
  );
}
