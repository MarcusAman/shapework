import { describe, it, expect } from 'vitest';
import {
  isPlaceholderDriveUrl,
  isRealGoogleDriveUrl,
  extractRealDriveUrlsFromText,
} from '../../server/services/askNoraDriveDelivery';

describe('askNoraDriveDelivery', () => {
  it('rejects 1DRV_ placeholder folder urls', () => {
    expect(
      isPlaceholderDriveUrl('https://drive.google.com/drive/folders/1DRV_414_HELP_ME_STREET')
    ).toBe(true);
    expect(isRealGoogleDriveUrl('https://drive.google.com/drive/folders/1DRV_414_HELP_ME_STREET')).toBe(
      false
    );
  });

  it('accepts real drive folder urls', () => {
    const url = 'https://drive.google.com/drive/folders/1abcDEFghijklmnopQRST';
    expect(isPlaceholderDriveUrl(url)).toBe(false);
    expect(isRealGoogleDriveUrl(url)).toBe(true);
  });

  it('extracts real drive links from notes and skips 1DRV fakes', () => {
    const notes = [
      '[Google Drive]: https://drive.google.com/drive/folders/1DRV_414_HELP_ME_STREET',
      'real: https://drive.google.com/drive/folders/1abcRealFolderId999',
    ].join('\n');
    const found = extractRealDriveUrlsFromText(notes);
    expect(found).toEqual(['https://drive.google.com/drive/folders/1abcRealFolderId999']);
  });
});
