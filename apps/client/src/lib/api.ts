import axios from "axios";

export const api = axios.create({
  baseURL: "",              // same-origin (Next) -> rewrite ke Laravel
  withCredentials: true,    // wajib supaya cookie session ikut
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

export async function getCsrfCookie() {
  // Sanctum akan set cookie XSRF-TOKEN
  await api.get("/sanctum/csrf-cookie");
}
