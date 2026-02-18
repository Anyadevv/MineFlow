export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bounties: {
        Row: {
          created_at: string | null
          id: string
          link: string
          platform: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link: string
          platform: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string
          platform?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          asset: string | null
          created_at: string | null
          credited: boolean | null
          id: string
          network: string | null
          status: string
          txid: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asset?: string | null
          created_at?: string | null
          credited?: boolean | null
          id?: string
          network?: string | null
          status?: string
          txid?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string | null
          created_at?: string | null
          credited?: boolean | null
          id?: string
          network?: string | null
          status?: string
          txid?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          created_at: string | null
          ends_at: string | null
          id: string
          plan_id: string
          start_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          ends_at?: string | null
          id?: string
          plan_id: string
          start_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          ends_at?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          daily_profit: number
          description: string | null
          duration_days: number
          id: string
          max_deposit: number
          min_deposit: number
          name: string
        }
        Insert: {
          created_at?: string | null
          daily_profit: number
          description?: string | null
          duration_days: number
          id?: string
          max_deposit: number
          min_deposit: number
          name: string
        }
        Update: {
          created_at?: string | null
          daily_profit?: number
          description?: string | null
          duration_days?: number
          id?: string
          max_deposit?: number
          min_deposit?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string | null
          deposit_balance: number | null
          earnings_balance: number | null
          email: string
          full_name: string | null
          id: string
          referral_code: string | null
          referrer_id: string | null
          role: string | null
          total_deposited: number | null
          total_withdrawn: number | null
          wallet_address: string | null
          wallet_base: string | null
          wallet_bnb: string | null
          wallet_btc: string | null
          wallet_eth: string | null
          wallet_solana: string | null
          wallet_ton: string | null
          wallet_tron: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          deposit_balance?: number | null
          earnings_balance?: number | null
          email?: string
          full_name?: string | null
          id: string
          referral_code?: string | null
          referrer_id?: string | null
          role?: string | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          wallet_address?: string | null
          wallet_base?: string | null
          wallet_bnb?: string | null
          wallet_btc?: string | null
          wallet_eth?: string | null
          wallet_solana?: string | null
          wallet_ton?: string | null
          wallet_tron?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          deposit_balance?: number | null
          earnings_balance?: number | null
          email?: string
          full_name?: string | null
          id?: string
          referral_code?: string | null
          referrer_id?: string | null
          role?: string | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          wallet_address?: string | null
          wallet_base?: string | null
          wallet_bnb?: string | null
          wallet_btc?: string | null
          wallet_eth?: string | null
          wallet_solana?: string | null
          wallet_ton?: string | null
          wallet_tron?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          plan_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          plan_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          plan_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          created_at: string | null
          id: string
          referred_user_id: string | null
          referrer_id: string | null
          status: string | null
        }
        Insert: {
          commission_amount: number
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reference_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          amount: number
          created_at: string | null
          daily_percent: number
          duration_days: number
          end_date: string | null
          id: string
          last_profit_at: string | null
          plan_id: string
          start_date: string | null
          status: string | null
          total_profit: number | null
          total_return: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_percent: number
          duration_days: number
          end_date?: string | null
          id?: string
          last_profit_at?: string | null
          plan_id: string
          start_date?: string | null
          status?: string | null
          total_profit?: number | null
          total_return?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_percent?: number
          duration_days?: number
          end_date?: string | null
          id?: string
          last_profit_at?: string | null
          plan_id?: string
          start_date?: string | null
          status?: string | null
          total_profit?: number | null
          total_return?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          address: string
          amount: number
          created_at: string | null
          currency: string
          id: string
          network: string
          status: string
          token: string | null
          user_id: string
        }
        Insert: {
          address: string
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          network: string
          status?: string
          token?: string | null
          user_id: string
        }
        Update: {
          address?: string
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          network?: string
          status?: string
          token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_plan: {
        Args: {
          p_user_id: string
          p_plan_id: string
          p_amount: number
          p_daily_percent: number
          p_duration_days: number
        }
        Returns: Json
      }
      approve_withdrawal: {
        Args: {
          p_withdrawal_id: string
        }
        Returns: Json
      }
      calculate_plan_roi: {
        Args: {
          p_amount: number
          p_daily_percent: number
          p_duration_days: number
        }
        Returns: Json
      }
      decrement_balance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      process_daily_roi: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reject_withdrawal: {
        Args: {
          p_withdrawal_id: string
        }
        Returns: Json
      }
      submit_secure_deposit: {
        Args: {
          p_user_id: string
          p_amount: number
          p_network: string
          p_txid: string
          p_coin: string
        }
        Returns: Json
      }
      submit_withdrawal_request: {
        Args: {
          p_user_id: string
          p_amount: number
          p_network: string
          p_address: string
          p_coin: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
