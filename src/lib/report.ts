/**
 * Hutuma kosa la kiufundi kwa msimamizi bila kuonyesha maelezo kwa mtumiaji.
 * "Fire and forget" — hitilafu yoyote hapa haizuii mtumiaji kuendelea.
 */
export function reportProblem(where: string, message: string, detail?: string) {
  if (typeof window === "undefined" || !message) return;
  try {
    void fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        where,
        message: message.slice(0, 800),
        detail: detail?.slice(0, 800),
        page: window.location.pathname,
      }),
    }).catch(() => {});
  } catch {
    // Hakuna cha kufanya — ujumbe kwa mtumiaji tayari unaonyeshwa.
  }
}
