const apiUrl = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:3001" : "")
).replace(/\/+$/, "");

export async function apiRequest(
  path,
  { method = "GET", body, token, signal, responseType = "json" } = {},
) {
  if (!apiUrl) {
    throw new Error("The portfolio API address is not configured.");
  }

  const isFormData = body instanceof FormData;

  const headers = {
    Accept: responseType === "blob" ? "image/*" : "application/json",
  };

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new Error(
      "Cannot connect to the portfolio service. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    const error = new Error(
      data?.error || `Request failed (${response.status}).`,
    );

    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;

  if (responseType === "blob") {
    return response.blob();
  }

  const data = await response.json().catch(() => null);

  if (!data) {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
}
export async function uploadProjectImage(file, token) {
  const body = new FormData();
  body.append("image", file);

  const result = await apiRequest("/api/uploads/project-image", {
    method: "POST",
    token,
    body,
  });

  return new URL(result.path, apiUrl).href;
}
