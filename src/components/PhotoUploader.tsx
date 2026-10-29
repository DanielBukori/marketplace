"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/media";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function PhotoUploader({
  userId,
  paths,
  onChange,
  max = 6,
}: {
  userId: string;
  paths: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const room = max - paths.length;
    if (room <= 0) {
      setError(fill(t.photo.maxReached, { max }));
      return;
    }

    const accepted: File[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!ALLOWED.includes(file.type)) {
        setError(fill(t.photo.badType, { name: file.name }));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(
          fill(t.photo.tooLarge, {
            name: file.name,
            size: MAX_BYTES / (1024 * 1024),
          }),
        );
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setBusy(true);
    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of accepted) {
      const ext = EXTENSIONS[file.type];
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) setError(uploadError.message);
      else uploaded.push(path);
    }

    setBusy(false);
    if (uploaded.length > 0) onChange([...paths, ...uploaded].slice(0, max));
  }

  function remove(path: string) {
    onChange(paths.filter((p) => p !== path));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {paths.map((path) => (
          <div key={path} className="relative aspect-square overflow-hidden rounded-2xl bg-paper-100">
            <Image
              src={mediaUrl(path) ?? ""}
              alt=""
              fill
              sizes="(max-width: 640px) 33vw, 25vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => remove(path)}
              aria-label={t.photo.removeAria}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-accent-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {paths.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-white text-primary-700 transition hover:bg-primary-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : <Plus size={22} />}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        multiple
        hidden
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-gray-400">{t.photo.hint}</p>
      {error && <p className="mt-2 text-sm text-accent-600">{error}</p>}
    </div>
  );
}
