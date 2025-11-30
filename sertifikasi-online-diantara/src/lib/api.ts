export async function loginPeserta(data: { email: string; password: string }) {
  console.log("Login payload (peserta):", data);
  console.log(
    "Login URL (peserta):",
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`,
  );

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Login failed (peserta):", res.status, errorText);
    
    // Create an error object with additional details
    const error: any = new Error(errorText);
    error.status = res.status;
    error.response = {
      status: res.status,
      data: { message: errorText }
    };
    throw error;
  }

  const responseData = await res.json();
  console.log("Login success (peserta):", responseData);
  return responseData;
}
export async function loginInstruktur(data: {
  email: string;
  password: string;
}) {
  console.log("Login payload (instruktur):", data);
  console.log(
    "Login URL (instruktur):",
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/instruktur/login`,
  );

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/instruktur/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  if (!res.ok) {
    let errorData;
    const errorText = await res.text();
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    console.error("Login failed (instruktur):", res.status, errorData);
    
    // Create an error object with additional details
    const error: any = new Error(errorData.message || errorText);
    error.status = res.status;
    error.response = {
      status: res.status,
      data: errorData
    };
    throw error;
  }

  const responseData = await res.json();
  console.log("Login success (instruktur):", responseData);
  return responseData;
}
export async function loginUser(data: { email: string; password: string }) {
  console.log("Login payload:", data);
  console.log(
    "Login URL:",
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/admins/login`,
  );

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/admins/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Login failed:", res.status, errorText);
    
    // Create an error object with additional details
    const error: any = new Error(errorText);
    error.status = res.status;
    error.response = {
      status: res.status,
      data: { message: errorText }
    };
    throw error;
  }

  const responseData = await res.json();
  console.log("Login success:", responseData);
  return responseData;
}
