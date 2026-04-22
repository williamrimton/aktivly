import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ session: null, user: null, loading: true, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Inactivity timeout: reset on user interaction
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      signOut();
    }, INACTIVITY_TIMEOUT_MS);
  }, [signOut]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up inactivity listeners when logged in
  useEffect(() => {
    if (!session) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    const handler = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer(); // start the timer

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, resetTimer]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
