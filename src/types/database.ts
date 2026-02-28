// src/types/database.ts - DATABASE TYPES
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
          tenant_id: string | null
          email: string
          name: string
          role: string | null
          avatar_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          tenant_id?: string | null
          email: string
          name: string
          role?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          email?: string
          name?: string
          role?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string | null
          plan: string | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          subdomain?: string | null
          plan?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string | null
          plan?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          name: string
          company_number: string | null
          email: string | null
          phone: string | null
          address: Json | null
          industry: string | null
          employee_count: number | null
          status: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          paye_reference: string | null
          accounts_office_ref: string | null
          pay_frequency: string | null
          pay_day: string | null
          tax_period_start: string | null
          pension_provider: string | null
          pension_staging_date: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          company_number?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          industry?: string | null
          employee_count?: number | null
          status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          paye_reference?: string | null
          accounts_office_ref?: string | null
          pay_frequency?: string | null
          pay_day?: string | null
          tax_period_start?: string | null
          pension_provider?: string | null
          pension_staging_date?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          company_number?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          industry?: string | null
          employee_count?: number | null
          status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          paye_reference?: string | null
          accounts_office_ref?: string | null
          pay_frequency?: string | null
          pay_day?: string | null
          tax_period_start?: string | null
          pension_provider?: string | null
          pension_staging_date?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
        }
      }
      checklist_templates: {
        Row: {
          id: string
          client_id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string | null
        }
      }
      payroll_runs: {
        Row: {
          id: string
          client_id: string
          tenant_id: string
          period_start: string
          period_end: string
          pay_date: string
          status: string
          rti_due_date: string | null
          eps_due_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          tenant_id: string
          period_start: string
          period_end: string
          pay_date: string
          status?: string
          rti_due_date?: string | null
          eps_due_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          tenant_id?: string
          period_start?: string
          period_end?: string
          pay_date?: string
          status?: string
          rti_due_date?: string | null
          eps_due_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      checklist_items: {
        Row: {
          id: string
          payroll_run_id: string
          template_id: string | null
          name: string
          is_completed: boolean
          completed_at: string | null
          completed_by: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          payroll_run_id: string
          template_id?: string | null
          name: string
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          payroll_run_id?: string
          template_id?: string | null
          name?: string
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          sort_order?: number
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}