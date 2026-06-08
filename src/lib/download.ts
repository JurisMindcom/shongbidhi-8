/**
 * Direct download helper that fetches the file as a blob and triggers
 * a download to the user's device. Falls back to opening in a new tab
 * if the fetch fails (e.g. CORS issues with non-public storage).
 */
export async function downloadFile(url: string, filename?: string) {
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj;
    a.download = filename || url.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 1000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}