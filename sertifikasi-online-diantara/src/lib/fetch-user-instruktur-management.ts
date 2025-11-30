// "use server";

import axios from "@/lib/axios";

export type UserType = {
  id: number;
  name: string;
  email: string;
  signature?: string | null;
  // optional additional fields added in backend model
  no_hp?: string | null;
  phone_number?: string | null;
  asal_institusi?: string | null;
  jenis_kelamin?: string | null;
  jabatan?: string | null;
};

export async function getUsers(merchantId?: number): Promise<UserType[]> {
  try {
    const url = merchantId ? `/instruktur?merchant_id=${merchantId}` : "/instruktur";
    const res = await axios.get(url);
    const data = res.data;

    console.log("Fetched instruktur raw data:", data);

    if (Array.isArray(data.users)) return data.users;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;

    console.error("Unexpected instruktur response shape:", data);
    return [];
  } catch (err: any) {
    console.error("Error fetching instruktur:", err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to fetch instruktur");
  }
}
export async function getUser(id: number): Promise<UserType | null> {
  try {
    const res = await axios.get(`/instruktur/${id}`);
    const data = res.data;
    if (data?.data) return data.data;
    if (data?.user) return data.user;
    return data;
  } catch (err) {
    console.error("Error fetching instruktur by id:", err);
    return null;
  }
}
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  merchant_id: number;
  role_id: number; 
}) {
  // Ambil merchant_id dari user/admin yang login
  let merchant_id: number | undefined = undefined;
  const user = typeof window !== "undefined" ? localStorage.getItem("user") : undefined;
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (typeof parsed.merchant_id === "number" && parsed.merchant_id > 0) merchant_id = parsed.merchant_id;
    } catch {}
  }
  if (!merchant_id || merchant_id === 0) {
    const merchantIdFromStorage = Number(localStorage.getItem("merchant_id"));
    if (merchantIdFromStorage > 0) merchant_id = merchantIdFromStorage;
  }
  const payload = { ...data, merchant_id: merchant_id ?? 1 };
  try {
    const headers: any = { Accept: "application/json" };
    let body: any;

    if (typeof (data as any).append === "function") {
      // data is FormData
      body = data as any;
      // Do not set Content-Type; browser will set multipart boundary
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    try {
      let res;
      if (typeof (data as any).append === "function") {
        // FormData
        res = await axios.post(`/instruktur`, data as any);
      } else {
        res = await axios.post(`/instruktur`, payload);
      }

      return res.data;
    } catch (err: any) {
      console.error("Error creating instruktur:", err?.response?.data || err?.message || err);
      throw new Error(err?.response?.data?.message || err?.message || "Failed to create instruktur");
    }
  } catch (err) {
    console.error("Error in createUser:", err);
    throw err;
  }
}

export async function updateUser(
  id: number,
  data:
    | {
        name?: string;
        email?: string;
        password?: string;
        signature?: string;
      }
    | FormData,
) {
  try {
    let res;
    if (typeof (data as any).append === "function") {
      // Use PUT method directly for FormData
      res = await axios.put(`/instruktur/${id}`, data as any);
    } else {
      res = await axios.put(`/instruktur/${id}`, data);
    }

    return res.data;
  } catch (err: any) {
    console.error("Error updating instruktur:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to update instruktur");
  }
}

export async function deleteUser(id: number) {
  try {
    const res = await axios.delete(`/instruktur/${id}`);
    return res.data;
  } catch (err: any) {
    console.error("Error deleting instruktur:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to delete instruktur");
  }
}
