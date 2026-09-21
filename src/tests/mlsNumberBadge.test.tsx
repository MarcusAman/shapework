import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MlsNumberBadge } from '../components/marketing/MlsNumberBadge';

describe('MlsNumberBadge Component', () => {
  it('renders correctly when mlsNumber is provided', () => {
    const html = renderToStaticMarkup(<MlsNumberBadge mlsNumber="100576001" />);
    expect(html).toContain('MLS#');
    expect(html).toContain('100576001');
    expect(html).toContain('Copy MLS number');
  });

  it('renders nothing when mlsNumber is missing or whitespace', () => {
    const htmlNull = renderToStaticMarkup(<MlsNumberBadge mlsNumber={null} />);
    expect(htmlNull).toBe('');

    const htmlEmpty = renderToStaticMarkup(<MlsNumberBadge mlsNumber="" />);
    expect(htmlEmpty).toBe('');

    const htmlWhitespace = renderToStaticMarkup(<MlsNumberBadge mlsNumber="   " />);
    expect(htmlWhitespace).toBe('');
  });

  it('supports size classes xs, sm, md', () => {
    const htmlXs = renderToStaticMarkup(<MlsNumberBadge mlsNumber="100576001" size="xs" />);
    expect(htmlXs).toContain('text-[10px]');

    const htmlSm = renderToStaticMarkup(<MlsNumberBadge mlsNumber="100576001" size="sm" />);
    expect(htmlSm).toContain('text-xs');

    const htmlMd = renderToStaticMarkup(<MlsNumberBadge mlsNumber="100576001" size="md" />);
    expect(htmlMd).toContain('text-sm');
  });
});
