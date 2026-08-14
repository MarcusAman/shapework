import { apiClient } from './apiClient';

export interface DirectoryPayload {
  directoryPeople: any[];
  workspaceId: string;
  fetchedAt: number;
}

const directoryCacheMap = new Map<string, Promise<DirectoryPayload | null>>();

export function getWorkspaceDirectory(workspaceId: string): Promise<DirectoryPayload | null> {
  if (!workspaceId) return Promise.resolve(null);

  if (directoryCacheMap.has(workspaceId)) {
    return directoryCacheMap.get(workspaceId)!;
  }

  const fetchPromise = apiClient
    .get(`/api/directory?workspaceId=${encodeURIComponent(workspaceId)}`, { workspaceId })
    .then(async (res) => {
      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.directoryPeople)) {
          return {
            directoryPeople: data.directoryPeople,
            workspaceId,
            fetchedAt: Date.now()
          };
        }
      }
      directoryCacheMap.delete(workspaceId);
      return null;
    })
    .catch(() => {
      directoryCacheMap.delete(workspaceId);
      return null;
    });

  directoryCacheMap.set(workspaceId, fetchPromise);
  return fetchPromise;
}

export function invalidateWorkspaceDirectoryCache(workspaceId?: string): void {
  if (workspaceId) {
    directoryCacheMap.delete(workspaceId);
  } else {
    directoryCacheMap.clear();
  }
}

export function clearAllDirectoryCaches(): void {
  directoryCacheMap.clear();
}

if (typeof window !== 'undefined') {
  window.addEventListener('shapework_directory_mutated', (e: any) => {
    const wsId = e?.detail?.workspaceId;
    invalidateWorkspaceDirectoryCache(wsId);
  });
}

