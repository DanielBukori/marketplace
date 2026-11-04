"use client";
import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut, UserRoundPen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { fill } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { userError } from "@/lib/user-error";
import type { Profile } from "@/lib/types";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 6 * 1024 * 1024;

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [hall, setHall] = useState(profile.hall ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_path);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function pickAvatar(file: File) {
    setError(null);
    setSaved(false);

    const ext = EXTENSIONS[file.type];
    if (!ext) {
      setError(fill(t.photo.badType, { name: file.name }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        fill(t.photo.tooLarge, { name: file.name, size: MAX_BYTES / (1024 * 1024) }),
      );
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${profile.id}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setError(userError(t, uploadError));
        return;
      }
      setAvatar(path);
    } catch {
      setError(t.common.error);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, hall, avatarPath: avatar ?? "" }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? t.common.error);
        errorRef.current?.focus();
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t.common.problems.offline);
    } finally {
      setBusy(false);
    }
  }

  const photo = mediaUrl(avatar);

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="flex items-center gap-4">
        <span className="tile relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
          {photo ? (
            <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <UserRoundPen size={22} className="text-gray-500" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900">{t.profile.avatar}</p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="mt-1 rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-bold text-primary-800 transition hover:bg-primary-50 disabled:opacity-60"
          >
            {uploading ? t.common.loading : t.profile.pick}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void pickAvatar(file);
            }}
            className="sr-only"
          />
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink-900">{t.profile.name}</span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={60}
          required
          autoComplete="name"
          className="field"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink-900">{t.profile.phone}</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="2557..."
          className="field"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink-900">{t.profile.hall}</span>
        <input
          value={hall}
          onChange={(event) => setHall(event.target.value)}
          maxLength={60}
          className="field"
        />
      </label>

      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600"
        >
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
          {t.profile.saved}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || uploading}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          {busy ? t.profile.saving : t.profile.save}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-600 transition hover:bg-paper-100"
        >
          <LogOut size={16} aria-hidden /> {t.profile.signOut}
        </button>
      </div>
    </form>
  );
}
