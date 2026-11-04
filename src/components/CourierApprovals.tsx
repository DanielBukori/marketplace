"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck, UserX } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

/**
 * Kituo cha uidhinishaji. Msimamizi ndiye anayebadilisha maombi kuwa
 * hali ya kazi — mtu hawezi kujiruhusu mwenyewe.
 */
export default function CourierApprovals({
  requests,
  approved,
}: {
  requests: Profile[];
  approved: Profile[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);

  async function act(profile: Profile, action: "approve" | "reject" | "revoke") {
    setBusyId(profile.id);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, action }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        name?: string;
      };
      if (!response.ok) {
        setNotice({ text: payload.message ?? t.common.error, bad: true });
        return;
      }
      const name = payload.name || profile.full_name;
      setNotice({
        text:
          action === "approve"
            ? fill(t.courier.approvedNow, { name })
            : action === "revoke"
              ? fill(t.courier.revokedNow, { name })
              : fill(t.courier.rejectedNow, { name }),
        bad: action !== "approve",
      });
      router.refresh();
    } catch {
      setNotice({ text: t.common.error, bad: true });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <p
          role={notice.bad ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            notice.bad ? "bg-accent-100 text-accent-600" : "bg-primary-50 text-primary-800"
          }`}
        >
          {notice.text}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.courier.requestsTitle}
        </h2>
        <p className="text-xs leading-relaxed text-gray-500">{t.courier.requestsDesc}</p>

        {requests.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            {t.courier.noRequests}
          </p>
        ) : (
          <ul className="space-y-2">
            {requests.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink-900">{person.full_name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {person.phone ?? "—"}
                    {person.hall ? ` · ${person.hall}` : ""}
                  </p>
                  {person.courier_requested_at && (
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(person.courier_requested_at).toLocaleString(t.localeDate)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => act(person, "approve")}
                  disabled={busyId === person.id}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-primary-900 disabled:opacity-50"
                >
                  {busyId === person.id ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={14} aria-hidden />
                  )}
                  {t.courier.approve}
                </button>
                <button
                  type="button"
                  onClick={() => act(person, "reject")}
                  disabled={busyId === person.id}
                  className="inline-flex items-center gap-2 rounded-full border border-accent-400 px-5 py-2.5 text-xs font-bold text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
                >
                  <UserX size={14} aria-hidden /> {t.courier.reject}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.courier.approvedList}
        </h2>

        {approved.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            {t.courier.noCouriers}
          </p>
        ) : (
          <ul className="space-y-2">
            {approved.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink-900">{person.full_name}</p>
                  <p className="mt-1 text-xs text-gray-500">{person.phone ?? "—"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => act(person, "revoke")}
                  disabled={busyId === person.id}
                  className="rounded-full border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 transition hover:border-accent-400 hover:text-accent-600 disabled:opacity-50"
                >
                  {t.courier.revoke}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-gray-500">{t.courier.moneyNote}</p>
    </div>
  );
}
