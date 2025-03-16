export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          is_admin: boolean
          created_at: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          email: string
          is_admin?: boolean
          created_at?: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean
          created_at?: string
          stripe_customer_id?: string | null
        }
      }
      songs: {
        Row: {
          id: string
          user_id: string | null
          title: string
          voice_sample_url: string
          preview_url: string | null
          full_song_url: string | null
          share_url: string | null
          status: string
          created_at: string
          paid: boolean
          stripe_price_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          voice_sample_url: string
          preview_url?: string | null
          full_song_url?: string | null
          share_url?: string | null
          status?: string
          created_at?: string
          paid?: boolean
          stripe_price_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          voice_sample_url?: string
          preview_url?: string | null
          full_song_url?: string | null
          share_url?: string | null
          status?: string
          created_at?: string
          paid?: boolean
          stripe_price_id?: string | null
        }
      }
      daily_stats: {
        Row: {
          id: string
          date: string
          generations: number
          earnings: number
          api_costs: number
        }
        Insert: {
          id?: string
          date?: string
          generations?: number
          earnings?: number
          api_costs?: number
        }
        Update: {
          id?: string
          date?: string
          generations?: number
          earnings?: number
          api_costs?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}