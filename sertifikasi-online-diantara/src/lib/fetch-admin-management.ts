import axios from "@/lib/axios";

export type AdminType = {
  id: number;
  name: string;
  email: string;
  merchant_id?: number; // optional: backend may include this
};

export async function fetchAdmins(merchantId?: number): Promise<AdminType[]> {
  try {
    const url = merchantId ? `/admins?merchant_id=${merchantId}` : "/admins";
    const res = await axios.get(url);
    const data = res.data;
    if (Array.isArray(data.admins)) return data.admins;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    console.error("Unexpected admin response shape:", data);
    return [];
  } catch (err: any) {
    console.error("Error fetching admins:", err);
    // rethrow so callers can handle toast/messages
    throw new Error(err?.response?.data?.message || err?.message || "Failed to fetch admins");
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  merchant_id: string;
}) {
  try {
    const res = await axios.post("/admins/create", data);
    return res.data;
  } catch (err: any) {
    console.error("Error creating admin:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to create admin");
  }
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string; password?: string },
) {
  try {
    const res = await axios.put(`/admins/edit/${id}`, data);
    return res.data;
  } catch (err: any) {
    console.error("Error updating admin:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to update admin");
  }
}

export async function deleteUser(id: number) {
  try {
    const res = await axios.delete(`/admins/delete/${id}`);
    return res.data;
  } catch (err: any) {
    console.error("Error deleting admin:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to delete admin");
  }
}
