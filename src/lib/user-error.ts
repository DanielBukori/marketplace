import type { Dict } from "@/lib/translations";

type Errorish = { message?: string; code?: string } | string | null | undefined;

function shape(error: Errorish) {
  if (typeof error === "string") return { message: error, code: undefined };
  return { message: error?.message ?? "", code: error?.code };
}

/**
 * Supabase na Postgres hujibu kwa Kiingereza cha kiufundi ("new row violates
 * row-level security policy …"). Mtumiaji anahitaji kujua kilichotokea kwa
 * lugha yake, kwa hivyo hapa mbinu za kawaida hubadilishwa kuwa nakala ya
 * kamusi. Kosa halisi hubakiwa kwenye konsoli ya msimamizi, si kwenye skrini.
 */
export function userError(t: Dict, error: unknown): string {
  const p = t.common.problems;
  const { message, code } = shape(error as Errorish);
  const text = message.toLowerCase();

  if (error instanceof TypeError) return p.offline;

  switch (code) {
    case "23505":
      return p.duplicate;
    case "23514":
    case "23502":
    case "23503":
    case "22P02":
      return p.invalid;
    case "42501":
    case "PGRST301":
      return p.denied;
  }

  if (/row-level security|permission denied|jwt expired|not authorized|invalid json|could not find the relationship/.test(text))
    return p.denied;
  if (/duplicate key|already exists|unique constraint/.test(text)) return p.duplicate;
  if (/violates check constraint|violates not-null|null value in column|invalid input syntax|violates foreign key/.test(text))
    return p.invalid;
  if (/failed to fetch|networkerror|network request failed|timeout|econn|fetch is not invoked/.test(text))
    return p.offline;
  if (/upload|storage|bucket|too large/.test(text)) return p.storage;
  if (!text) return p.unknown;

  if (process.env.NODE_ENV === "development") {
    console.warn("[makosa] nakala isiyojulikana:", message);
  }
  return p.unknown;
}
