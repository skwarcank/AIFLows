import { describe, expect, it } from 'vitest';

import {
  buildDefaultWorkspaceName,
  buildDefaultWorkspaceSlug,
  ensureAppShellState,
  type WorkspaceStore,
} from '../lib/app-state';

function createStore(overrides: Partial<WorkspaceStore>): WorkspaceStore {
  return {
    findWorkspaceByOwner: async () => null,
    createWorkspace: async () => ({ id: 'workspace-1', name: 'My Workspace', slug: 'user-123' }),
    findFirstIntegration: async () => null,
    ...overrides,
  };
}

describe('app shell state', () => {
  it('builds a friendly default workspace name from email', () => {
    expect(buildDefaultWorkspaceName('krzysztof.skwarcan@example.com')).toBe("Krzysztof Skwarcan's Workspace");
    expect(buildDefaultWorkspaceName(undefined)).toBe('My Workspace');
  });

  it('builds a deterministic workspace slug from the user id', () => {
    expect(buildDefaultWorkspaceSlug('ABC-123')).toBe('user-abc-123');
  });

  it('creates a default workspace when the user has none and returns onboarding state', async () => {
    const calls: string[] = [];
    const store = createStore({
      findWorkspaceByOwner: async () => {
        calls.push('findWorkspaceByOwner');
        return null;
      },
      createWorkspace: async ({ userId, email }) => {
        calls.push(`createWorkspace:${userId}:${email}`);
        return { id: 'workspace-1', name: "Krzysztof's Workspace", slug: 'user-1' };
      },
      findFirstIntegration: async (workspaceId) => {
        calls.push(`findFirstIntegration:${workspaceId}`);
        return null;
      },
    });

    const state = await ensureAppShellState(store, { id: 'user-1', email: 'krzysztof@example.com' });

    expect(state).toEqual({
      workspace: { id: 'workspace-1', name: "Krzysztof's Workspace", slug: 'user-1' },
      integration: null,
    });
    expect(calls).toEqual([
      'findWorkspaceByOwner',
      'createWorkspace:user-1:krzysztof@example.com',
      'findFirstIntegration:workspace-1',
    ]);
  });

  it('recovers from a concurrent workspace create by re-reading the workspace', async () => {
    let lookupCount = 0;
    const store = createStore({
      findWorkspaceByOwner: async () => {
        lookupCount += 1;
        return lookupCount === 1 ? null : { id: 'workspace-1', name: 'Recovered Workspace', slug: 'user-1' };
      },
      createWorkspace: async () => {
        throw new Error('duplicate key value violates unique constraint');
      },
    });

    const state = await ensureAppShellState(store, { id: 'user-1', email: 'user@example.com' });
    expect(state.workspace.name).toBe('Recovered Workspace');
    expect(state.integration).toBeNull();
  });

  it('returns the first integration when one already exists', async () => {
    const store = createStore({
      findWorkspaceByOwner: async () => ({ id: 'workspace-1', name: 'Existing Workspace', slug: 'user-1' }),
      createWorkspace: async () => {
        throw new Error('should not create a workspace');
      },
      findFirstIntegration: async () => ({
        id: 'integration-1',
        provider: 'hermes',
        name: 'Main Hermes',
        status: 'active',
      }),
    });

    const state = await ensureAppShellState(store, { id: 'user-1', email: 'user@example.com' });
    expect(state.integration?.provider).toBe('hermes');
    expect(state.integration?.name).toBe('Main Hermes');
  });
});
