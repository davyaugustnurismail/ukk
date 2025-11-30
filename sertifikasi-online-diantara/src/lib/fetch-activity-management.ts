export interface CreateActivityPayload {
  activity_name: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  activity_type_id: number;
  description: string;
  instruktur_name?: string;
  instruktur_id?: number;
  merchant_id?: number;
}

export async function createActivity(payload: CreateActivityPayload) {
  // Validasi payload
  if (!payload.activity_name) throw new Error("activity_name is required");
  if (!payload.date) throw new Error("date is required");
  if (!payload.activity_type_id)
    throw new Error("activity_type_id is required");
  if (!payload.description) throw new Error("description is required");
  if (!payload.instruktur_id) throw new Error("instruktur_id is required");
  if (!payload.instruktur_name) throw new Error("instruktur_name is required");

  const finalPayload = {
    activity_name: String(payload.activity_name).trim(),
    date: payload.date,
    time_start: payload.time_start || null,
    time_end: payload.time_end || null,
    activity_type_id: Number(payload.activity_type_id),
    description: String(payload.description).trim(),
    instruktur_name: payload.instruktur_name,
    instruktur_id: Number(payload.instruktur_id),
    merchant_id: Number(payload.merchant_id || 1),
  };

  console.log("Original payload:", payload);
  console.log("Final payload:", finalPayload);

  try {
    const res = await axios.post("/data-activities", finalPayload);
    return res.data;
  } catch (error: any) {
    console.error("Error response:", {
      message: error.response?.data?.message,
      errors: error.response?.data?.errors,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}
import axios from "@/lib/axios";

export interface ActivityType {
  id: number;
  type_name: string;
  merchant_id: number;
}

export interface Activity {
  id: number;
  activity_name: string;
  date: string;
  time_start: string;
  time_end: string;
  activity_type_id: number;
  description: string;
  activityType?: ActivityType;
  instruktur?: { id: number; name: string };
  instruktur_name?: string;
  instruktur_id?: number;
  merchant_id?: number;
}

export async function getActivities(): Promise<Activity[]> {
  const res = await axios.get("/data-activities");
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}
