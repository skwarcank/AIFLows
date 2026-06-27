import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
}

export interface IntegrationRecord {
  id: string;
  provider: string;
  name: string;
  status: string;
}

export interface AppShellState {
  workspace: WorkspaceRecord;
  integration: IntegrationRecord | null;
}

export interface WorkspaceStore {
  findWorkspaceByOwner(userId: string): Promise<WorkspaceRecord | null>;
  createWorkspace(input: { userId: string; email?: string }): Promise<WorkspaceRecord>;
  findFirstIntegration(workspaceId: string): Promise<IntegrationRecord | null>;
}

export function buildDefaultWorkspaceName(email?: string): string {
  const localPart = email?.split('@')[0]?.trim();
  if (!localPart) return 'My Workspace';

  const normalized = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
    .trim();

  return normalized ? `${normalized}'s Workspace` : 'My Workspace';
}

export function buildDefaultWorkspaceSlug(userId: string): string {
  return `user-${userId.toLowerCase()}`;
}

export async function ensureAppShellState(store: WorkspaceStore, user: Pick<User, 'id' | 'email'>): Promise<AppShellState> {
  let workspace = await store.findWorkspaceByOwner(user.id);

  if (!workspace) {
    try {
      workspace = await store.createWorkspace({ userId: user.id, email: user.email ?? undefined });
    } catch (error) {
      workspace = await store.findWorkspaceByOwner(user.id);
      if (!workspace) {
        throw error;
      }
    }
  }

  const integration = await store.findFirstIntegration(workspace.id);
  return { workspace, integration };
}

export function createSupabaseWorkspaceStore(supabase: SupabaseClient<any, 'public', any>): WorkspaceStore {
  return {
    async findWorkspaceByOwner(userId) {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug')
        .eq('created_by', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async createWorkspace({ userId, email }) {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          created_by: userId,
          name: buildDefaultWorkspaceName(email),
          slug: buildDefaultWorkspaceSlug(userId),
        })
        .select('id, name, slug')
        .single();

      if (error) throw error;
      return data;
    },

    async findFirstIntegration(workspaceId) {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, provider, name, status')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  };
}
