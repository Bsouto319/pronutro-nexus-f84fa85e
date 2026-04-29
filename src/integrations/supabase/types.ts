export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          date: string
          doctor_name: string | null
          google_event_id: string | null
          id: string
          lembrete_enviado: boolean
          notes: string | null
          organization_id: string
          paciente_nome: string | null
          paciente_telefone: string | null
          patient_name: string
          profissional: string | null
          source: string | null
          status: string
          time: string | null
          titulo: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          date?: string
          doctor_name?: string | null
          google_event_id?: string | null
          id?: string
          lembrete_enviado?: boolean
          notes?: string | null
          organization_id: string
          paciente_nome?: string | null
          paciente_telefone?: string | null
          patient_name: string
          profissional?: string | null
          source?: string | null
          status?: string
          time?: string | null
          titulo?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          date?: string
          doctor_name?: string | null
          google_event_id?: string | null
          id?: string
          lembrete_enviado?: boolean
          notes?: string | null
          organization_id?: string
          paciente_nome?: string | null
          paciente_telefone?: string | null
          patient_name?: string
          profissional?: string | null
          source?: string | null
          status?: string
          time?: string | null
          titulo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          created_at: string
          entradas: number
          id: string
          name: string
          organization_id: string
          saidas: number
          saldo: number
        }
        Insert: {
          created_at?: string
          entradas?: number
          id?: string
          name: string
          organization_id: string
          saidas?: number
          saldo?: number
        }
        Update: {
          created_at?: string
          entradas?: number
          id?: string
          name?: string
          organization_id?: string
          saidas?: number
          saldo?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_doctors: {
        Row: {
          bio: string | null
          commission_percent: number | null
          created_at: string
          crm: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          patients_count: number
          phone: string | null
          revenue: number
          schedule: Json | null
          specialty: string | null
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          bio?: string | null
          commission_percent?: number | null
          created_at?: string
          crm?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          patients_count?: number
          phone?: string | null
          revenue?: number
          schedule?: Json | null
          specialty?: string | null
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          bio?: string | null
          commission_percent?: number | null
          created_at?: string
          crm?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          patients_count?: number
          phone?: string | null
          revenue?: number
          schedule?: Json | null
          specialty?: string | null
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_doctors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_patients: {
        Row: {
          allergies: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          current_medications: string | null
          diagnostics: string | null
          doctor_id: string | null
          email: string | null
          hpp: string | null
          id: string
          important_notes: string | null
          name: string
          organization_id: string
          payment_method: string | null
          phone: string | null
          pre_notes: string | null
          referral: string | null
          total: number
        }
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          current_medications?: string | null
          diagnostics?: string | null
          doctor_id?: string | null
          email?: string | null
          hpp?: string | null
          id?: string
          important_notes?: string | null
          name: string
          organization_id: string
          payment_method?: string | null
          phone?: string | null
          pre_notes?: string | null
          referral?: string | null
          total?: number
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          current_medications?: string | null
          diagnostics?: string | null
          doctor_id?: string | null
          email?: string | null
          hpp?: string | null
          id?: string
          important_notes?: string | null
          name?: string
          organization_id?: string
          payment_method?: string | null
          phone?: string | null
          pre_notes?: string | null
          referral?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "clinic_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          bank: string | null
          category: string | null
          created_at: string
          date: string
          description: string | null
          doctor: string | null
          id: string
          installments: number
          organization_id: string
          patient: string | null
          payment_date: string | null
          payment_method: string | null
          type: string
          value_in: number
          value_out: number
        }
        Insert: {
          bank?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          doctor?: string | null
          id?: string
          installments?: number
          organization_id: string
          patient?: string | null
          payment_date?: string | null
          payment_method?: string | null
          type: string
          value_in?: number
          value_out?: number
        }
        Update: {
          bank?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          doctor?: string | null
          id?: string
          installments?: number
          organization_id?: string
          patient?: string | null
          payment_date?: string | null
          payment_method?: string | null
          type?: string
          value_in?: number
          value_out?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          created_at: string
          id: string
          message: string | null
          organization_id: string
          patient_id: string
          scheduled_date: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          patient_id: string
          scheduled_date?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          patient_id?: string
          scheduled_date?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string | null
          created_at: string
          data_gasto: string | null
          descricao: string
          doctor_id: string | null
          fornecedor: string | null
          id: string
          metodo_pagamento: string | null
          organization_id: string
          origem_pagamento: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_gasto?: string | null
          descricao?: string
          doctor_id?: string | null
          fornecedor?: string | null
          id?: string
          metodo_pagamento?: string | null
          organization_id: string
          origem_pagamento?: string | null
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_gasto?: string | null
          descricao?: string
          doctor_id?: string | null
          fornecedor?: string | null
          id?: string
          metodo_pagamento?: string | null
          organization_id?: string
          origem_pagamento?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "gastos_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "clinic_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          channel: string | null
          created_at: string
          email: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          name: string
          organization_id: string
          phone: string | null
          source: string | null
          status: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          name: string
          organization_id: string
          phone?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_subscriptions: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          last_payment_date: string | null
          last_payment_value: number | null
          monthly_value: number
          notes: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_value?: number | null
          monthly_value?: number
          notes?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_value?: number | null
          monthly_value?: number
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          cnpj: string | null
          contact_email: string | null
          created_at: string
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          owner_cpf: string | null
          owner_name: string | null
          owner_role: string | null
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          cnpj?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          owner_cpf?: string | null
          owner_name?: string | null
          owner_role?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          cnpj?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          owner_cpf?: string | null
          owner_name?: string | null
          owner_role?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      patient_consultations: {
        Row: {
          consultation_date: string
          created_at: string
          doctor_id: string | null
          id: string
          medications: string | null
          notes: string | null
          organization_id: string
          patient_id: string
          payment_method: string | null
          procedure_name: string | null
          procedure_value: number
          quantities: string | null
        }
        Insert: {
          consultation_date?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          organization_id: string
          patient_id: string
          payment_method?: string | null
          procedure_name?: string | null
          procedure_value?: number
          quantities?: string | null
        }
        Update: {
          consultation_date?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          organization_id?: string
          patient_id?: string
          payment_method?: string | null
          procedure_name?: string | null
          procedure_value?: number
          quantities?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "clinic_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consultations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invoices: {
        Row: {
          created_at: string
          doctor_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          mime_type: string
          notes: string | null
          organization_id: string
          patient_id: string
          updated_at: string
          uploaded_by: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          mime_type: string
          notes?: string | null
          organization_id: string
          patient_id: string
          updated_at?: string
          uploaded_by?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          mime_type?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          updated_at?: string
          uploaded_by?: string | null
          value?: number | null
        }
        Relationships: []
      }
      patient_prescriptions: {
        Row: {
          cid: string | null
          content: string
          created_at: string
          doctor_id: string | null
          id: string
          instructions: string | null
          issued_date: string
          organization_id: string
          patient_id: string
          prescription_type: string
          title: string
        }
        Insert: {
          cid?: string | null
          content: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          instructions?: string | null
          issued_date?: string
          organization_id: string
          patient_id: string
          prescription_type?: string
          title: string
        }
        Update: {
          cid?: string | null
          content?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          instructions?: string | null
          issued_date?: string
          organization_id?: string
          patient_id?: string
          prescription_type?: string
          title?: string
        }
        Relationships: []
      }
      procedures: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          organization_id: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          organization_id: string
          price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_blocked: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "doctor" | "staff" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "doctor", "staff", "super_admin"],
    },
  },
} as const
