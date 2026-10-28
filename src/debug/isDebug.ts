export function isDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") return true;
  try {
    return window.localStorage.getItem("UNO_DEBUG") === "1";
  } catch {
    return false;
  }
}
