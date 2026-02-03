import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_type: 'patient' | 'doctor';
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type: 'patient' | 'doctor';
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_type?: 'patient' | 'doctor';
          full_name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      doctors: {
        Row: {
          id: string;
          specialization: string;
          license_number: string;
          is_available: boolean;
          years_of_experience: number;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          specialization: string;
          license_number: string;
          is_available?: boolean;
          years_of_experience?: number;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          specialization?: string;
          license_number?: string;
          is_available?: boolean;
          years_of_experience?: number;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consultations: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string | null;
          status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
          urgency_level: 'low' | 'medium' | 'high' | 'critical';
          symptoms: string;
          notes: string | null;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id?: string | null;
          status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
          urgency_level: 'low' | 'medium' | 'high' | 'critical';
          symptoms: string;
          notes?: string | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string | null;
          status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
          urgency_level?: 'low' | 'medium' | 'high' | 'critical';
          symptoms?: string;
          notes?: string | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
