// src/lib/session-client.ts

export type SessionResponse = {
  ok?: boolean;
  role?: string | null;
  me?: any;
  message?: string;
};

export function pickUser(me: any) {
  // backend kadang wrap ke { user: {...} }
  return me?.user ?? me ?? null;
}

export function getPerms(user: any) {
  return {
    canCreate: Boolean(user?.can_create),
    canReview: Boolean(user?.can_review),
    canPublish: Boolean(user?.can_publish),
  };
}

export async function fetchSessionClient(): Promise<SessionResponse> {
  const res = await fetch("/api/session", {
    method: "POST", // konsisten dengan layout kamu
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) return { ok: false, role: null, me: null };
  const data = (await res.json().catch(() => null)) as SessionResponse | null;
  return data ?? { ok: false, role: null, me: null };
}
