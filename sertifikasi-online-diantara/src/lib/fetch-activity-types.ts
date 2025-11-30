export const createActivityType = async (data: {
  type_name: string;
  merchant_id: number;
}) => {
  try {
    const response = await api.post('/activity-types', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating activity type:', error);
    throw error;
  }
};
import api from "@/lib/axios";
import axios from "@/lib/axios";


export interface ActivityType {
  id: number;
  type_name: string;
  merchant_id: number;
}

export async function getActivityTypes(): Promise<ActivityType[]> {
  const res = await axios.get("/data-activity-types");
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}
