import axios from "@/lib/axios";

export async function updateUser(
  userId: number,
  data: {
    name: string;
    email: string;
    no_hp: string;
    asal_institusi: string;
    merchant_id: number;
    password?: string;
    password_confirmation?: string;
  },
) {
  try {
    const res = await axios.put(`/users/${userId}`, data);
    return res.data;
  } catch (err: any) {
    console.error("Failed to update user:", err?.response?.data || err?.message || err);
    // preserve backend error shape when possible
    if (err?.response && err.response.data) throw { response: { data: err.response.data } };
    throw new Error(err?.message || "Failed to update user");
  }
}

export type UserType = {
  role_id(role_id: any): unknown;
  id: number;
  name: string;
  email: string;
  no_hp: string;
  asal_institusi: string;
  activities?: ActivityType[];
  merchant_id?: number;
  // optional field representing one or more member types/roles (e.g. 'peserta', 'panitia')
  type_member?: string | string[];
};

export type ActivityType = {
  id: number;
  name?: string;
  date?: string;
  activity_name?: string;
  merchant_id?: number;
};

export async function getUsers(): Promise<UserType[]> {
  const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`;
  const res = await fetch(baseUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await res.json();
  // Handle common response shapes from backend:
  // - top-level array
  // - { data: [...] }
  // - { users: [...] }
  // - { data: { users: [...] } }
  // - other nested shapes where an array appears at depth 1
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.users)) return data.users;
  if (data && data.data && Array.isArray(data.data.users)) return data.data.users;

  // Try to find first array value at depth 1
  if (data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (Array.isArray(val)) return val;
      if (val && typeof val === "object") {
        for (const k2 of Object.keys(val)) {
          const v2 = (val as any)[k2];
          if (Array.isArray(v2)) return v2;
        }
      }
    }
  }

  // If nothing found, try a couple of fallbacks (pagination / merchant filter)
  if ((!data || (Array.isArray(data) && data.length === 0))) {
    try {
      // Try to fetch more items (some backends paginate)
  const perPageRes = await fetch(`${baseUrl}?perPage=1000`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
      });
      if (perPageRes.ok) {
        const pData = await perPageRes.json().catch(() => null);
        if (Array.isArray(pData)) return pData;
        if (pData && Array.isArray(pData.data)) return pData.data;
      }
    } catch (e) {
      // ignore
    }

    try {
      // If merchant_id is stored in localStorage (client), try to request by merchant
      if (typeof window !== 'undefined') {
        const localMerchant = Number(localStorage.getItem('merchant_id')) || undefined;
        if (localMerchant && localMerchant > 0) {
          const mRes = await fetch(`${baseUrl}?merchant_id=${localMerchant}`, {
            method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
          });
          if (mRes.ok) {
            const mData = await mRes.json().catch(() => null);
            if (Array.isArray(mData)) return mData;
            if (mData && Array.isArray(mData.data)) return mData.data;
            if (mData && Array.isArray(mData.users)) return mData.users;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

    // If backend returned a paginated shape like { data: [...], total: N },
    // try to fetch all items in one request using per_page if total > returned length.
    try {
      const total = data && typeof data === 'object' && (data.total || data.meta?.total || data.pagination?.total);
      const returnedCount = Array.isArray(data.data) ? data.data.length : (Array.isArray(data) ? data.length : 0);
      // determine last_page if available
      const lastPage = data && typeof data === 'object' && (data.last_page || data.meta?.last_page || data.pagination?.last_page);
      // if backend paginated and there are more items, fetch pages sequentially (cap to avoid huge requests)
      if ((total && Number(total) > returnedCount) || (lastPage && Number(lastPage) > 1)) {
        try {
    const resolvedTotal = Number(total) || 0;
    const perPageReturned = Number(data.per_page || data.perPage || data.meta?.per_page || data.pagination?.per_page) || (Array.isArray(data.data) ? data.data.length : 10);
    const resolvedLastPage = Number(lastPage) || (resolvedTotal ? Math.ceil(resolvedTotal / perPageReturned) : 0);
    const capItems = Math.min(resolvedTotal || (resolvedLastPage ? resolvedLastPage * Math.max(perPageReturned, 10) : 1000), 2000);
    const capPerPage = Math.min(capItems, 1000);

          // If server allows large per_page, try single-request first
          if (capPerPage > 0) {
            const allRes = await fetch(`${baseUrl}?perPage=${capPerPage}`, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
            if (allRes.ok) {
              const allData = await allRes.json().catch(() => null);
              if (Array.isArray(allData)) return allData;
              if (allData && Array.isArray(allData.data)) return allData.data;
              if (allData && Array.isArray(allData.users)) return allData.users;
            }
          }

          // Fallback: fetch pages one by one up to reasonable limit
    const pages: any[] = [];
    const pagesToFetch = resolvedLastPage && resolvedLastPage > 0 ? Math.min(resolvedLastPage, 100) : Math.min(Math.ceil((resolvedTotal || 0) / Math.max(perPageReturned, 10)) || 10, 100);
          // include page 1 result if it contains an array
          if (Array.isArray(data.data)) pages.push(...data.data);
          else if (Array.isArray(data)) pages.push(...data);

    for (let p = 2; p <= pagesToFetch; p++) {
            try {
      const pageRes = await fetch(`${baseUrl}?page=${p}&perPage=${Math.max(perPageReturned, 100)}`, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
              if (!pageRes.ok) break;
              const pageData = await pageRes.json().catch(() => null);
              if (!pageData) break;
              if (Array.isArray(pageData)) {
                pages.push(...pageData);
              } else if (Array.isArray(pageData.data)) {
                pages.push(...pageData.data);
              } else if (Array.isArray(pageData.users)) {
                pages.push(...pageData.users);
              } else {
                // try to find array deeper
                for (const k of Object.keys(pageData)) {
                  const v = (pageData as any)[k];
                  if (Array.isArray(v)) {
                    pages.push(...v);
                    break;
                  }
                }
              }
              // stop early if we've reached total
              if (resolvedTotal && pages.length >= resolvedTotal) break;
            } catch (e) {
              break;
            }
          }
          if (pages.length > 0) return pages;
        } catch (e) {
          // ignore fallback failure
        }
      }
    } catch (e) {
      // ignore fallback failure
    }
  return [];
}

// Ambil activity yang diikuti oleh peserta tertentu
export async function getUserActivities(userId: number): Promise<ActivityType[]> {
  try {
    // use axios instance so it includes baseURL and Authorization header
    const res = await (await import("@/lib/axios")).default.get(`/users/${userId}/activities`);
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (err: any) {
    console.error("Failed to fetch user activities:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to fetch user activities");
  }
}

export async function deleteUser(userId: number): Promise<void> {
  try {
    const axiosInstance = (await import("@/lib/axios")).default;
    await axiosInstance.delete(`/users/${userId}`);
  } catch (err: any) {
    console.error("Failed to delete user:", err?.response?.data || err?.message || err);
    throw new Error(err?.response?.data?.message || err?.message || "Failed to delete user");
  }
}

export async function createUser(payload: {
  name: string;
  email: string;
  no_hp: string;
  asal_institusi: string;
  password: string;
  password_confirmation: string;
  role_id: number;
  merchant_id: number;
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
  const requestPayload = { ...payload, merchant_id: merchant_id ?? 1 };
  try {
    const axiosInstance = (await import("@/lib/axios")).default;
    const res = await axiosInstance.post(`/users`, requestPayload);
    const responseData = res.data;
    // Normalize server-side validation shape
    const hasTopErrors = responseData && (responseData.errors || responseData.error || responseData.status === "error" || responseData.success === false);
    const nested = responseData && responseData.data;
    const hasNestedErrors = nested && (nested.errors || nested.error || nested.status === "error" || nested.success === false);
    if (hasTopErrors || hasNestedErrors) {
      throw { response: { data: responseData } };
    }
    return responseData;
  } catch (err: any) {
    console.error("Error creating peserta:", err?.response?.data || err?.message || err);
    // rethrow preserving api error shape where possible
    if (err?.response && err.response.data) throw { response: { data: err.response.data } };
    throw err;
  }
}
