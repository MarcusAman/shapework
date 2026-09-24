/** Stub durable assets — fail closed. */
export async function saveDurableAssetAsync(_input: any): Promise<any> {
  throw new Error('durableAssetRepository stub: not available on this branch');
}
export async function getDurableAssetByFilenameAsync(_filename: string): Promise<any | null> {
  return null;
}
export async function getDurableAssetByIdAsync(_id: string): Promise<any | null> {
  return null;
}
export async function createAssetDownloadTokenAsync(_input: any): Promise<any> {
  throw new Error('durableAssetRepository stub: tokens unavailable');
}
export async function verifyAndConsumeDownloadTokenAsync(_token: string): Promise<any | null> {
  return null;
}
export async function revokeDownloadTokenAsync(_tokenId: string): Promise<void> {}
export async function listTokensForTaskAsync(_taskId: string): Promise<any[]> {
  return [];
}
