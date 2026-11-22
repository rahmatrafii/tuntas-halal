
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "audit_events": {
                  Row: {
                    "actor_id": string | null,"after": NonNullable<Json>,"before": Json | null,"case_id": string,"created_at": string,"event_type": string,"id": string,"task_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"after": NonNullable<Json>,"before"?: Json | null,"case_id": string,"created_at"?: string,"event_type": string,"id"?: string,"task_id"?: string | null
                  }
                  Update: {
                    "actor_id"?: string | null,"after"?: NonNullable<Json>,"before"?: Json | null,"case_id"?: string,"created_at"?: string,"event_type"?: string,"id"?: string,"task_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_case_id_fkey"
      columns: ["case_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_events_case_id_task_id_fkey"
      columns: ["case_id","task_id"]
isOneToOne: false
      referencedRelation: "revision_tasks"
      referencedColumns: ["case_id","id"]
    }
                  ]
                },"business_contacts": {
                  Row: {
                    "business_name": string,"created_at": string,"greeting_name": string,"id": string,"organization_id": string,"owner_id": string,"updated_at": string,"version": number,"whatsapp_number": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name": string,"created_at"?: string,"greeting_name"?: string,"id"?: string,"organization_id": string,"owner_id": string,"updated_at"?: string,"version"?: number,"whatsapp_number": string
                  }
                  Update: {
                    "business_name"?: string,"created_at"?: string,"greeting_name"?: string,"id"?: string,"organization_id"?: string,"owner_id"?: string,"updated_at"?: string,"version"?: number,"whatsapp_number"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_contacts_organization_id_owner_id_fkey"
      columns: ["organization_id","owner_id"]
isOneToOne: false
      referencedRelation: "memberships"
      referencedColumns: ["organization_id","user_id"]
    }
                  ]
                },"cases": {
                  Row: {
                    "assignee_id": string,"contact_id": string,"created_at": string,"id": string,"official_reference": string | null,"organization_id": string,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id": string,"contact_id": string,"created_at"?: string,"id"?: string,"official_reference"?: string | null,"organization_id": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "assignee_id"?: string,"contact_id"?: string,"created_at"?: string,"id"?: string,"official_reference"?: string | null,"organization_id"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cases_organization_id_assignee_id_fkey"
      columns: ["organization_id","assignee_id"]
isOneToOne: false
      referencedRelation: "memberships"
      referencedColumns: ["organization_id","user_id"]
    },{
      foreignKeyName: "cases_organization_id_contact_id_fkey"
      columns: ["organization_id","contact_id"]
isOneToOne: false
      referencedRelation: "business_contacts"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "cases_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "is_active": boolean,"organization_id": string,"role": Database["public"]['Enums']["membership_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "is_active"?: boolean,"organization_id": string,"role": Database["public"]['Enums']["membership_role"],"user_id": string
                  }
                  Update: {
                    "is_active"?: boolean,"organization_id"?: string,"role"?: Database["public"]['Enums']["membership_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"timezone"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"timezone"?: string
                  }
                  Relationships: [

                  ]
                },"revision_tasks": {
                  Row: {
                    "case_id": string,"created_at": string,"follow_up_on": string | null,"id": string,"instruction": string,"status": Database["public"]['Enums']["revision_status"],"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "case_id": string,"created_at"?: string,"follow_up_on"?: string | null,"id"?: string,"instruction": string,"status"?: Database["public"]['Enums']["revision_status"],"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "case_id"?: string,"created_at"?: string,"follow_up_on"?: string | null,"id"?: string,"instruction"?: string,"status"?: Database["public"]['Enums']["revision_status"],"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "revision_tasks_case_id_fkey"
      columns: ["case_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "case_is_complete":
{ Args: { "p_case_id": string }; Returns: boolean
                           },
"create_case":
{ Args: { "p_contact_id": string,"p_id": string,"p_official_reference": string,"p_organization_id": string,"p_request_id": string }; Returns: Json
                           },
"create_contact":
{ Args: { "p_business_name": string,"p_confirm_duplicate": boolean,"p_greeting_name": string,"p_id": string,"p_organization_id": string,"p_request_id": string,"p_whatsapp_number": string }; Returns: Json
                           },
"create_task":
{ Args: { "p_case_id": string,"p_follow_up_on": string,"p_id": string,"p_instruction": string,"p_request_id": string }; Returns: Json
                           },
"set_task_statuses":
{ Args: { "p_case_id": string,"p_completion_confirmed": boolean,"p_expected_versions": Json,"p_follow_up_on": string,"p_request_id": string,"p_status": Database["public"]['Enums']["revision_status"],"p_task_ids": (string)[] }; Returns: Json
                           },
"transfer_case":
{ Args: { "p_assignee_id": string,"p_expected_version": number,"p_id": string,"p_request_id": string }; Returns: Json
                           },
"update_case":
{ Args: { "p_expected_version": number,"p_id": string,"p_official_reference": string,"p_request_id": string }; Returns: Json
                           },
"update_contact":
{ Args: { "p_business_name": string,"p_confirm_duplicate": boolean,"p_expected_version": number,"p_greeting_name": string,"p_id": string,"p_request_id": string,"p_whatsapp_number": string }; Returns: Json
                           },
"update_task":
{ Args: { "p_completion_confirmed": boolean,"p_expected_version": number,"p_follow_up_on": string,"p_id": string,"p_instruction": string,"p_request_id": string,"p_status": Database["public"]['Enums']["revision_status"] }; Returns: Json
                           },
"update_task_instruction":
{ Args: { "p_expected_version": number,"p_id": string,"p_instruction": string,"p_request_id": string }; Returns: Json
                           }
          }
          Enums: {
            "membership_role": "companion"|"coordinator","revision_status": "needs_sending"|"awaiting_reply"|"needs_review"|"completed"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "membership_role": ["companion", "coordinator"],"revision_status": ["needs_sending", "awaiting_reply", "needs_review", "completed"]
          }
        }
} as const
