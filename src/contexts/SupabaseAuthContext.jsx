import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);
const AUTH_REQUEST_TIMEOUT_MS = 8000;
let supabaseClientPromise = null;

const getSupabaseClient = async () => {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('@/lib/customSupabaseClient').then((mod) => mod.supabase);
  }
  return supabaseClientPromise;
};

const withTimeout = (promise, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth timeout')), timeoutMs);
    }),
  ]);
};

export const AuthProvider = ({ children, autoInit = true }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(autoInit);

  const getSupabase = useCallback(async () => {
    return getSupabaseClient();
  }, []);

  const fetchProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const supabase = await getSupabase();
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      );

      if (error && error.code !== 'PGRST116') { // PGRST116: row not found
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile (timeout/network):', error);
      setProfile(null);
    }
  }, [getSupabase]);

  const ensureInitialized = useCallback(async () => {
    try {
      const supabase = await getSupabase();
      const { data: { session } } = await withTimeout(supabase.auth.getSession());
      setSession(session);
      setUser(session?.user ?? null);
      await fetchProfile(session?.user);
    } catch (error) {
      console.error('Error initializing auth session:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, getSupabase]);

  useEffect(() => {
    if (!autoInit) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    let mounted = true;
    let subscription = null;

    const initAuth = async () => {
      const supabase = await getSupabase();
      if (!mounted) return;

      const { data } = supabase.auth.onAuthStateChange(
        async (event, nextSession) => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          await fetchProfile(nextSession?.user);
          if (event === 'SIGNED_OUT') {
            setProfile(null);
          }
        }
      );
      subscription = data.subscription;
      await ensureInitialized();
    };

    const scheduleInit = () => {
      initAuth().catch((error) => {
        console.error('Error initializing auth listener:', error);
        setLoading(false);
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(scheduleInit, { timeout: 2500 });
    } else {
      setTimeout(scheduleInit, 600);
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [autoInit, ensureInitialized, fetchProfile, getSupabase]);

  const signUp = useCallback(async (email, password, options) => {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no registro",
        description: error.message || "Algo deu errado",
      });
    }
    return { user: data.user, error };
  }, [getSupabase, toast]);

  const signIn = useCallback(async (email, password) => {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no login",
        description: error.message || "Credenciais inválidas.",
      });
      return { user: null, profile: null, error };
    }
  
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, nome, ativo')
        .eq('id', data.user.id)
        .single();

      // Admin: domínio wgalmeida.com.br
      const isAdmin = data.user.email?.endsWith('@wgalmeida.com.br') ?? false;
      const profile = profileData ? { ...profileData, role: isAdmin ? 'admin' : 'user' } : { role: isAdmin ? 'admin' : 'user' };

      return { user: data.user, profile, error: null };
    }
    
    return { user: null, profile: null, error: new Error('Usuário não encontrado após o login.') };
  }, [getSupabase, toast]);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no logout",
        description: error.message || "Algo deu errado",
      });
    } else {
        setUser(null);
        setSession(null);
        setProfile(null);
    }
    return { error };
  }, [getSupabase, toast]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    ensureInitialized,
    signUp,
    signIn,
    signOut,
  }), [user, profile, session, loading, ensureInitialized, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

