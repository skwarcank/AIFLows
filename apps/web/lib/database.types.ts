export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type IntegrationStatus = 'pending' | 'connected' | 'syncing' | 'offline' | 'error' | 'active' | 'paused' | 'revoked';
export type FlowStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['workspaces']['Insert'], 'id'>>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'member';
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>;
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          workspace_id: string;
          provider: string;
          external_id: string;
          name: string;
          status: IntegrationStatus;
          last_synced_at: string | null;
          last_heartbeat_at: string | null;
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          provider?: string;
          external_id: string;
          name: string;
          status?: IntegrationStatus;
          last_synced_at?: string | null;
          last_heartbeat_at?: string | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['integrations']['Insert'], 'id'>>;
        Relationships: [];
      };
      integration_profiles: {
        Row: {
          id: string;
          workspace_id: string;
          integration_id: string;
          external_id: string;
          name: string;
          profile_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          integration_id: string;
          external_id: string;
          name: string;
          profile_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['integration_profiles']['Insert'], 'id'>>;
        Relationships: [];
      };
      flows: {
        Row: {
          id: string;
          workspace_id: string;
          integration_id: string;
          integration_profile_id: string | null;
          external_id: string;
          title: string;
          prompt: string;
          final_answer: string | null;
          status: FlowStatus;
          started_at: string | null;
          finished_at: string | null;
          source: string | null;
          model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          integration_id: string;
          integration_profile_id?: string | null;
          external_id: string;
          title: string;
          prompt: string;
          final_answer?: string | null;
          status?: FlowStatus;
          started_at?: string | null;
          finished_at?: string | null;
          source?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['flows']['Insert'], 'id'>>;
        Relationships: [];
      };
      steps: {
        Row: {
          id: string;
          workspace_id: string;
          flow_id: string;
          external_id: string | null;
          step_index: number;
          kind: string;
          title: string;
          description: string | null;
          tool_name: string | null;
          tool_metadata: Json;
          occurred_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          flow_id: string;
          external_id?: string | null;
          step_index: number;
          kind: string;
          title: string;
          description?: string | null;
          tool_name?: string | null;
          tool_metadata?: Json;
          occurred_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['steps']['Insert'], 'id'>>;
        Relationships: [];
      };
      pairing_tokens: {
        Row: {
          id: string;
          workspace_id: string;
          integration_id: string;
          token_hash: string;
          token_prefix: string;
          expires_at: string;
          used_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          integration_id: string;
          token_hash: string;
          token_prefix: string;
          expires_at: string;
          used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['pairing_tokens']['Insert'], 'id'>>;
        Relationships: [];
      };
      connector_tokens: {
        Row: {
          id: string;
          workspace_id: string;
          integration_id: string;
          token_hash: string;
          token_prefix: string;
          last_used_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          integration_id: string;
          token_hash: string;
          token_prefix: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['connector_tokens']['Insert'], 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SupabaseTable<TableName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TableName];
export type SupabaseRow<TableName extends keyof Database['public']['Tables']> = SupabaseTable<TableName>['Row'];
export type SupabaseInsert<TableName extends keyof Database['public']['Tables']> = SupabaseTable<TableName>['Insert'];
export type SupabaseUpdate<TableName extends keyof Database['public']['Tables']> = SupabaseTable<TableName>['Update'];
