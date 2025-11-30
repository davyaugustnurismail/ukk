"use client";

import { Header } from "@/components/Layouts/Peserta/header";
import { Sidebar } from "@/components/Layouts/Peserta/sidebar";
import { SidebarProvider } from "@/components/Layouts/Peserta/sidebar/sidebar-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
