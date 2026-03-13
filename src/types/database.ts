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
          mode: string | null
          allowed_domains: string[] | null
          demo_data_active: boolean | null
          can_switch_modes: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          subdomain?: string | null
          plan?: string | null
          settings?: Json | null
          mode?: string | null
          allowed_domains?: string[] | null
          demo_data_active?: boolean | null
          can_switch_modes?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string | null
          plan?: string | null
          settings?: Json | null
          mode?: string | null
          allowed_domains?: string[] | null
          demo_data_active?: boolean | null
          can_switch_modes?: boolean | null
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
          pension_reenrolment_date: string | null
          declaration_of_compliance_deadline: string | null
          payroll_software: string | null
          period_start: string | null
          period_end: string | null
          employment_allowance: boolean | null
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
          pension_reenrolment_date?: string | null
          declaration_of_compliance_deadline?: string | null
          payroll_software?: string | null
          period_start?: string | null
          period_end?: string | null
          employment_allowance?: boolean | null
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
          pension_reenrolment_date?: string | null
          declaration_of_compliance_deadline?: string | null
          payroll_software?: string | null
          period_start?: string | null
          period_end?: string | null
          employment_allowance?: boolean | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
        }
      }
      payrolls: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          name: string
          paye_reference: string | null
          accounts_office_ref: string | null
          pay_frequency: string | null
          pay_day: string | null
          period_start: string | null
          period_end: string | null
          payroll_software: string | null
          employment_allowance: boolean | null
          pension_provider: string | null
          pension_staging_date: string | null
          pension_reenrolment_date: string | null
          declaration_of_compliance_deadline: string | null
          status: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          name: string
          paye_reference?: string | null
          accounts_office_ref?: string | null
          pay_frequency?: string | null
          pay_day?: string | null
          period_start?: string | null
          period_end?: string | null
          payroll_software?: string | null
          employment_allowance?: boolean | null
          pension_provider?: string | null
          pension_staging_date?: string | null
          pension_reenrolment_date?: string | null
          declaration_of_compliance_deadline?: string | null
          status?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          name?: string
          paye_reference?: string | null
          accounts_office_ref?: string | null
          pay_frequency?: string | null
          pay_day?: string | null
          period_start?: string | null
          period_end?: string | null
          payroll_software?: string | null
          employment_allowance?: boolean | null
          pension_provider?: string | null
          pension_staging_date?: string | null
          pension_reenrolment_date?: string | null
          declaration_of_compliance_deadline?: string | null
          status?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      checklist_templates: {
        Row: {
          id: string
          client_id: string
          payroll_id: string | null
          name: string
          sort_order: number
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          payroll_id?: string | null
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          payroll_id?: string | null
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
          payroll_id: string | null
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
          payroll_id?: string | null
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
          payroll_id?: string | null
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
      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          user_email: string
          action: 'CREATE' | 'UPDATE' | 'DELETE'
          resource_type: string
          resource_id: string | null
          resource_name: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          user_email: string
          action: 'CREATE' | 'UPDATE' | 'DELETE'
          resource_type: string
          resource_id?: string | null
          resource_name?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          user_email?: string
          action?: 'CREATE' | 'UPDATE' | 'DELETE'
          resource_type?: string
          resource_id?: string | null
          resource_name?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
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
      training_records: {
        Row: {
          id: string
          tenant_id: string
          created_by: string
          title: string
          provider: string | null
          category: string | null
          url: string | null
          notes: string | null
          completed: boolean
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          created_by: string
          title: string
          provider?: string | null
          category?: string | null
          url?: string | null
          notes?: string | null
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          created_by?: string
          title?: string
          provider?: string | null
          category?: string | null
          url?: string | null
          notes?: string | null
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feature_requests: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'submitted' | 'planned' | 'considering' | 'working_on' | 'will_not_implement' | 'future'
          created_by_user_id: string | null
          created_by_email: string | null
          created_by_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'submitted' | 'planned' | 'considering' | 'working_on' | 'will_not_implement' | 'future'
          created_by_user_id?: string | null
          created_by_email?: string | null
          created_by_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'submitted' | 'planned' | 'considering' | 'working_on' | 'will_not_implement' | 'future'
          created_by_user_id?: string | null
          created_by_email?: string | null
          created_by_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feature_request_votes: {
        Row: {
          id: string
          feature_request_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          feature_request_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          feature_request_id?: string
          user_id?: string
          created_at?: string
        }
      }
      email_logs: {
        Row: {
          id: string
          email_type: string
          recipient_email: string
          reference_id: string
          sent_at: string
        }
        Insert: {
          id?: string
          email_type: string
          recipient_email: string
          reference_id: string
          sent_at?: string
        }
        Update: {
          id?: string
          email_type?: string
          recipient_email?: string
          reference_id?: string
          sent_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          badge_key: string
          badge_tier: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          badge_key: string
          badge_tier?: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          badge_key?: string
          badge_tier?: string
          earned_at?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          payrolls_completed: number
          early_completions: number
          steps_completed: number
          early_steps: number
          current_streak_weeks: number
          longest_streak_weeks: number
          perfect_months: number
          consecutive_perfect_months: number
          zero_overdue_months: number
          last_activity_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          payrolls_completed?: number
          early_completions?: number
          steps_completed?: number
          early_steps?: number
          current_streak_weeks?: number
          longest_streak_weeks?: number
          perfect_months?: number
          consecutive_perfect_months?: number
          zero_overdue_months?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          payrolls_completed?: number
          early_completions?: number
          steps_completed?: number
          early_steps?: number
          current_streak_weeks?: number
          longest_streak_weeks?: number
          perfect_months?: number
          consecutive_perfect_months?: number
          zero_overdue_months?: number
          last_activity_date?: string | null
          updated_at?: string
        }
      }
      ai_documents: {
        Row: {
          id: string
          title: string
          source_url: string | null
          category: string | null
          file_path: string | null
          status: 'pending' | 'processing' | 'ready' | 'error'
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          source_url?: string | null
          category?: string | null
          file_path?: string | null
          status?: 'pending' | 'processing' | 'ready' | 'error'
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          source_url?: string | null
          category?: string | null
          file_path?: string | null
          status?: 'pending' | 'processing' | 'ready' | 'error'
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_document_chunks: {
        Row: {
          id: string
          document_id: string
          content: string
          chunk_index: number
          section_title: string | null
          embedding: number[] | null
          token_count: number | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          chunk_index: number
          section_title?: string | null
          embedding?: number[] | null
          token_count?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          content?: string
          chunk_index?: number
          section_title?: string | null
          embedding?: number[] | null
          token_count?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      ai_conversations: {
        Row: {
          id: string
          tenant_id: string | null
          user_id: string | null
          title: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          title?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          title?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          citations: Json | null
          token_count: number | null
          model: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          citations?: Json | null
          token_count?: number | null
          model?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          citations?: Json | null
          token_count?: number | null
          model?: string | null
          created_at?: string | null
        }
      }
      ai_api_keys: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[]
          rate_limit: number
          is_active: boolean
          last_used_at: string | null
          expires_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          key_hash: string
          key_prefix: string
          scopes?: string[]
          rate_limit?: number
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          key_hash?: string
          key_prefix?: string
          scopes?: string[]
          rate_limit?: number
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string | null
        }
      }
      ai_api_usage: {
        Row: {
          id: string
          api_key_id: string | null
          tenant_id: string | null
          endpoint: string
          input_tokens: number
          output_tokens: number
          status: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          api_key_id?: string | null
          tenant_id?: string | null
          endpoint: string
          input_tokens?: number
          output_tokens?: number
          status?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          api_key_id?: string | null
          tenant_id?: string | null
          endpoint?: string
          input_tokens?: number
          output_tokens?: number
          status?: number | null
          created_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          tenant_id: string | null
          user_email: string
          user_name: string | null
          category: 'bug' | 'improvement' | 'other'
          message: string
          page_url: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id?: string | null
          user_email: string
          user_name?: string | null
          category: 'bug' | 'improvement' | 'other'
          message: string
          page_url?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string | null
          user_email?: string
          user_name?: string | null
          category?: 'bug' | 'improvement' | 'other'
          message?: string
          page_url?: string | null
          user_agent?: string | null
          created_at?: string
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