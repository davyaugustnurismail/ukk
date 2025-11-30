"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const name = localStorage.getItem("user_name") || "";
    const email = localStorage.getItem("user_email") || "";
    setUser({ name, email });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");

    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

    setIsOpen(false);

    const isDarkMode = document.documentElement.classList.contains("dark");

    Swal.fire({
      title: "Berhasil Logout!",
      text: "Anda telah berhasil keluar dari akun",
      icon: "success",
      background: isDarkMode ? "#1e293b" : "#fff",
      color: isDarkMode ? "#fff" : "#000",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      router.push("/auth/admin/signin");
    });
  };

  const confirmLogout = () => {
    setIsOpen(false);
    const isDarkMode = document.documentElement.classList.contains("dark");

    Swal.fire({
      title: "Yakin Mau Logout?",
      text: "Kamu Akan Keluar Dari Akun Ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
      background: isDarkMode ? "#1e293b" : "#fff",
      color: isDarkMode ? "#fff" : "#000",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-3">
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{user.name}</span>
            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>
      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>
        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {user.name}
            </div>
            <div className="leading-none text-gray-6">{user.email}</div>
          </figcaption>
        </figure>
        <hr className="border-[#E8E8E8] dark:border-dark-3" />
        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/admin/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />
            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>
        </div>
        <hr className="border-[#E8E8E8] dark:border-dark-3" />
        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={confirmLogout}
          >
            <LogOutIcon />
            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
