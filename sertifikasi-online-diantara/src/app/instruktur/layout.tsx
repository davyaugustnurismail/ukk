"use client";

import { Header } from "@/components/Layouts/Instruktur/header";
import { Sidebar } from "@/components/Layouts/Instruktur/sidebar";
import { SidebarProvider } from "@/components/Layouts/Instruktur/sidebar/sidebar-context";
import { useAccessDeniedNotif } from "@/hooks/useAccessDeniedNotif";


export default function InstrukturLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Show access denied notification if user tried to access unauthorized activity
  useAccessDeniedNotif();

  return (
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
  );
}
