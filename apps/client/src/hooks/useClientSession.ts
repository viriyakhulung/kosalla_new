"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSessionClient, getPerms, pickUser, SessionResponse } from "@/lib/session-client";

export function useClientSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionResponse | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const s = await fetchSessionClient().catch(() => ({ ok: false }));
      if (!alive) return;
      setSession(s as SessionResponse);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const user = useMemo(() => pickUser(session?.me), [session?.me]);
  const perms = useMemo(() => getPerms(user), [user]);

  return { loading, session, user, perms };
}
