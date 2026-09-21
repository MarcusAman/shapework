export function isRealGoogleDriveUrl(url?: string | null): boolean {
  if (!url) return false;
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}
export async function loadLocalProofAttachments(_task: any): Promise<any[]> {
  return [];
}
export async function ensureAskNoraDeliveryDrivePack(task: any, _opts?: any): Promise<any> {
  return { task, driveUrl: null, stub: true };
}
