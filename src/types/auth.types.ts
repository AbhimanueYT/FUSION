import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface UserWithMetadata extends SupabaseUser {
  user_metadata: {
    full_name?: string;
  };
} 

export interface AuthState {
  session: Session | null;
  user: SupabaseUser | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  full_name: string;
}