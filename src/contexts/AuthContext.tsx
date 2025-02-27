import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState, LoginCredentials, RegisterCredentials, User, UserWithMetadata } from '../types/auth.types';
import { router } from 'expo-router';

interface AuthContextType {
  state: AuthState;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  user: UserWithMetadata | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          loading: false,
        }));
        router.replace('/(tabs)/dashboard');
      } else {
        setState(prev => ({
          ...prev,
          session: null,
          user: null,
          loading: false,
        }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          loading: false,
        }));
        router.replace('/(tabs)/dashboard');
      } else {
        setState(prev => ({
          ...prev,
          session: null,
          user: null,
          loading: false,
        }));
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async ({ email, password }: LoginCredentials) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      // Explicitly navigate to dashboard after successful sign in
      router.replace('/(tabs)/dashboard');
    }
  };

  const signUp = async ({ email, password, full_name }: RegisterCredentials) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Explicitly navigate to login after sign out
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ 
      state, 
      signIn, 
      signUp, 
      signOut,
      user: state.user as UserWithMetadata | null
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 