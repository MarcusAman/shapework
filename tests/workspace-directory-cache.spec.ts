/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getWorkspaceDirectory,
  invalidateWorkspaceDirectoryCache,
  clearAllDirectoryCaches,
  DirectoryPayload
} from '../src/utils/directoryCache';
import { apiClient } from '../src/utils/apiClient';

describe('Workspace Directory Cache Unit Suite', () => {
  beforeEach(() => {
    clearAllDirectoryCaches();
    vi.restoreAllMocks();
  });

  it('1. Parses response body exactly once and returns cached payload on subsequent calls', async () => {
    const mockPeople = [{ id: 'p1', name: 'Melissa Gagliardi' }];
    const jsonSpy = vi.fn().mockResolvedValue({ directoryPeople: mockPeople });
    const mockResponse = { ok: true, json: jsonSpy } as unknown as Response;

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

    // First call fetches from API
    const res1 = await getWorkspaceDirectory('ws_alpha');
    expect(res1?.directoryPeople).toEqual(mockPeople);
    expect(jsonSpy).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Second call uses cached Promise result without re-fetching or re-parsing json
    const res2 = await getWorkspaceDirectory('ws_alpha');
    expect(res2?.directoryPeople).toEqual(mockPeople);
    expect(jsonSpy).toHaveBeenCalledTimes(1); // Still 1!
    expect(apiClient.get).toHaveBeenCalledTimes(1); // Still 1!
  });

  it('2. Enforces strict tenant isolation between different workspace IDs', async () => {
    const peopleA = [{ id: 'pa', name: 'Alpha Agent' }];
    const peopleB = [{ id: 'pb', name: 'Beta Agent' }];

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('ws_alpha')) {
        return { ok: true, json: async () => ({ directoryPeople: peopleA }) } as Response;
      }
      if (url.includes('ws_beta')) {
        return { ok: true, json: async () => ({ directoryPeople: peopleB }) } as Response;
      }
      return { ok: false } as Response;
    });

    const resA = await getWorkspaceDirectory('ws_alpha');
    const resB = await getWorkspaceDirectory('ws_beta');

    expect(resA?.directoryPeople).toEqual(peopleA);
    expect(resB?.directoryPeople).toEqual(peopleB);
    expect(resA?.directoryPeople).not.toEqual(resB?.directoryPeople);
  });

  it('3. Removes failed requests from cache so future attempts can retry', async () => {
    vi.spyOn(apiClient, 'get')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directoryPeople: [{ id: 'p3', name: 'Retry Person' }] })
      } as Response);

    // First attempt fails
    const resFail = await getWorkspaceDirectory('ws_retry');
    expect(resFail).toBeNull();

    // Second attempt retries and succeeds
    const resSuccess = await getWorkspaceDirectory('ws_retry');
    expect(resSuccess?.directoryPeople[0].name).toBe('Retry Person');
  });

  it('4. Invalidation clears specific workspace or all caches on signout', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      ok: true,
      json: async () => ({ directoryPeople: [{ id: 'px', name: 'Person X' }] })
    } as Response);

    await getWorkspaceDirectory('ws_inv1');
    await getWorkspaceDirectory('ws_inv2');
    expect(apiClient.get).toHaveBeenCalledTimes(2);

    // Invalidate ws_inv1 only
    invalidateWorkspaceDirectoryCache('ws_inv1');

    await getWorkspaceDirectory('ws_inv1'); // Re-fetches
    await getWorkspaceDirectory('ws_inv2'); // Uses cached
    expect(apiClient.get).toHaveBeenCalledTimes(3);

    // Signout clears all
    clearAllDirectoryCaches();
    await getWorkspaceDirectory('ws_inv2'); // Re-fetches
    expect(apiClient.get).toHaveBeenCalledTimes(4);
  });
});
