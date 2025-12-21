import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
  updateUserProfile as supabaseUpdateProfile,
} from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: AuthError | null; needsConfirmation: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: {
    name?: string;
    avatar_url?: string;
    phone?: string;
  }) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setState({
          user: session?.user ?? null,
          session: session,
          isLoading: false,
          isAuthenticated: !!session,
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      setState({
        user: session?.user ?? null,
        session: session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
    }

    return { error };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { data, error } = await signUpWithEmail(email, password, name);

      setState((prev) => ({ ...prev, isLoading: false }));

      // Check if email confirmation is required
      const needsConfirmation = !error && !data.session;

      return { error, needsConfirmation };
    },
    [],
  );

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const { error } = await supabaseSignOut();

    if (!error) {
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }

    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabaseResetPassword(email);
    return { error };
  }, []);

  const updateProfile = useCallback(
    async (updates: { name?: string; avatar_url?: string; phone?: string }) => {
      const { error } = await supabaseUpdateProfile(updates);

      if (!error) {
        // Refresh user data
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setState((prev) => ({ ...prev, user }));
      }

      return { error };
    },
    [],
  );

  const refreshSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.refreshSession();

    setState((prev) => ({
      ...prev,
      user: session?.user ?? null,
      session: session,
      isAuthenticated: !!session,
    }));
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Helper hook for protected routes
export function useRequireAuth() {
  const auth = useAuth();

  return {
    ...auth,
    isReady: !auth.isLoading,
  };
}
