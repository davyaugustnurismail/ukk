"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../../FormElements/InputGroup";
import { Checkbox } from "../../FormElements/checkbox";
import { useRouter } from "next/navigation";
import { loginInstruktur } from "@/lib/api";
import { setAuthCookie } from "@/lib/set-cookie";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SigninWithPassword() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
    role: "instruktur", // default
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
      const response = await loginInstruktur({
        email: data.email,
        password: data.password,
      });

      console.log("Response dari backend:", response);

      // Get role ID from response
      const roleId =
        response?.instruktur?.role_id ||
        response?.instruktur?.["role_id "] ||
        response?.role_id;
      console.log("Role ID:", roleId);

      if (response.token && response.instruktur) {
        localStorage.setItem("token", response.token);

        // Simpan data user sebagai satu objek lengkap
        const userData = {
          id: response.instruktur.id,
          name: response.instruktur.name,
          email: response.instruktur.email,
          merchant_id: response.instruktur.merchant_id || 1,
          role: "instruktur",
        };
        localStorage.setItem("user", JSON.stringify(userData));

        const role = "instruktur";
        document.cookie = `token=${response.token}; path=/`;
        document.cookie = `role=${role}; path=/`;

        toast.success("Login berhasil! Selamat datang kembali.");
        // Redirect ke halaman instruktur
        router.push("/instruktur/dashboard");
      }
    } catch (error: any) {
      console.error(error);

      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

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
