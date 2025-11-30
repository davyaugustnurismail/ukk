"use client";

import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
// Modern Hamburger Icon
function ModernHamburger({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center">
      <span
        className={`absolute h-0.5 w-6 bg-gray-700 transition-all duration-300 dark:bg-gray-200 ${open ? "top-3.5 rotate-45" : "top-2"}`}
      />
      <span
        className={`absolute h-0.5 w-6 bg-gray-700 transition-all duration-300 dark:bg-gray-200 ${open ? "opacity-0" : "top-3"}`}
      />
      <span
        className={`absolute h-0.5 w-6 bg-gray-700 transition-all duration-300 dark:bg-gray-200 ${open ? "top-3.5 -rotate-45" : "top-4"}`}
      />
    </span>
  );
}
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

export function Header() {
  const { isMobile, isOpen } = useSidebarContext();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      {isMobile && (
          <Link href={"/"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
            {/* Logo image removed: not used */}
          </Link>
      )}

      <div className="max-xl">
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          Admin Page
        </h1>
        <p className="font-medium">Sertifikat Online DiAntara</p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        {/*<div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div> */}

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
