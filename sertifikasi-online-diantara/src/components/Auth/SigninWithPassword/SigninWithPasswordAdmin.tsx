"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../../FormElements/InputGroup";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SigninWithPassword() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type, value } = e.target;
    const fieldValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      console.log("Response dari backend:", response);

      console.log("Response dari backend:", response);
      console.log("response.admin.merchant_id:", response.admin.merchant_id);

      if (response.token && response.admin) {
        localStorage.setItem("token", response.token);
        // Simpan email dan nama user ke localStorage dengan key yang sesuai header
        if (response.admin.email) {
          localStorage.setItem("user_email", response.admin.email);
        }
        if (response.admin.name) {
          localStorage.setItem("user_name", response.admin.name);
        }
        if (response.admin.merchant_id && response.admin.merchant_id !== 0) {
          localStorage.setItem("merchant_id", response.admin.merchant_id);
          console.log("Stored merchant_id in localStorage:", response.admin.merchant_id);
        } else {
          localStorage.removeItem("merchant_id"); // Ensure it's not stored if 0 or falsy
          console.log("Removed merchant_id from localStorage (was 0 or falsy).");
        }
        
        // Dapatkan role dari role_id (bisa 1 atau "1")
        const role = "admin";
        // Simpan token dan role ke cookie
        document.cookie = `token=${response.token}; path=/`;
        document.cookie = `role=${role}; path=/`;

        toast.success("Login berhasil! Selamat datang kembali.");
        // Redirect ke halaman admin
        router.push("/admin");
      }
    } catch (error: any) {
      console.error(error);

      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        const roleId = error.response?.data?.role_id;

        if (status === 404) {
          toast.error(
            "Email tidak terdaftar. Silakan periksa kembali email Anda.",
          );
        } else if (status === 401) {
          if (message?.toLowerCase().includes("password")) {
            toast.error(
              "Password yang Anda masukkan salah. Silakan coba lagi.",
            );
          } else {
            toast.error("Email atau password salah. Silakan coba lagi.");
          }
        } else {
          toast.error("Terjadi kesalahan. Silakan coba lagi nanti.");
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Gagal melakukan login. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="email"
        label="Email"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your email"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type="password"
        label="Password"
        className="mb-5 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
      />

      <div className="mb-4.5 py-5">
        <button
          type="submit"
          disabled={loading}
          className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 ${
            loading ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );
}
