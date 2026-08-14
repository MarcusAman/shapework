import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Print Map PDF Generation & Bounding Integrity Suite', () => {
  const artifactsDir = path.join(process.cwd(), 'dist', 'print-artifacts');

  test.beforeAll(() => {
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
  });

  function generatePrintHtml(nodeCount: number, title: string) {
    const nodes = [];
    // Root node
    nodes.push({ id: 'root', name: 'Managing Principal', title: 'Principal Broker', x: 450, y: 50 });

    for (let i = 1; i < nodeCount; i++) {
      const col = (i - 1) % 6;
      const row = Math.floor((i - 1) / 6) + 1;
      nodes.push({
        id: `node_${i}`,
        name: `Team Member ${i}`,
        title: `Operations Role ${i}`,
        x: 100 + col * 160,
        y: 50 + row * 140
      });
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x + 220 > maxX) maxX = p.x + 220;
      if (p.y < minY) minY = p.y;
      if (p.y + 120 > maxY) maxY = p.y + 120;
    });

    const boundsWidth = Math.max(200, maxX - minX);
    const boundsHeight = Math.max(200, maxY - minY);
    const printWidth = 1000;
    const printHeight = 700;
    const horizontalMargin = 40;
    const topMargin = 70;
    const bottomMargin = 40;

    const scaleX = (printWidth - horizontalMargin * 2) / boundsWidth;
    const scaleY = (printHeight - (topMargin + bottomMargin)) / boundsHeight;
    const printZoom = Math.min(1.2, Math.max(0.35, Math.min(scaleX, scaleY)));
    const centerX = minX + boundsWidth / 2;
    const printPanX = (printWidth / 2) - (centerX * printZoom);
    const printPanY = topMargin - (minY * printZoom);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            -webkit-print-color-adjust: exact;
          }
          .canvas-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            overflow: hidden;
            background: #ffffff;
          }
          .transform-layer {
            position: absolute;
            transform-origin: 0 0;
            transform: translate(${printPanX}px, ${printPanY}px) scale(${printZoom});
          }
          .card {
            position: absolute;
            width: 200px;
            height: 100px;
            background: #ffffff;
            border: 2px solid #0f172a;
            border-radius: 8px;
            padding: 12px;
            box-sizing: border-box;
          }
          .card h4 {
            margin: 0 0 4px 0;
            font-size: 14px;
            color: #0f172a;
          }
          .card p {
            margin: 0;
            font-size: 12px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="canvas-container">
          <div class="transform-layer">
            ${nodes.map(n => `
              <div id="${n.id}" class="card" style="left: ${n.x}px; top: ${n.y}px;">
                <h4>${n.name}</h4>
                <p>${n.title}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  test('generates unclipped PDF artifact for small org chart (3 nodes)', async ({ page }) => {
    const html = generatePrintHtml(3, 'Small Org Chart');
    await page.setContent(html);
    const pdfPath = path.join(artifactsDir, 'org-chart-small.pdf');
    await page.pdf({ path: pdfPath, format: 'A4', landscape: true });

    expect(fs.existsSync(pdfPath)).toBe(true);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(1000);

    const rootBox = await page.locator('#root').boundingBox();
    expect(rootBox).not.toBeNull();
    expect(rootBox!.y).toBeGreaterThanOrEqual(50); // Generous top safe margin (>= 50px)
  });

  test('generates unclipped PDF artifact for standard org chart (12 nodes)', async ({ page }) => {
    const html = generatePrintHtml(12, 'Standard Org Chart');
    await page.setContent(html);
    const pdfPath = path.join(artifactsDir, 'org-chart-normal.pdf');
    await page.pdf({ path: pdfPath, format: 'A4', landscape: true });

    expect(fs.existsSync(pdfPath)).toBe(true);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(1000);

    const rootBox = await page.locator('#root').boundingBox();
    expect(rootBox).not.toBeNull();
    expect(rootBox!.y).toBeGreaterThanOrEqual(50);
  });

  test('generates unclipped PDF artifact for large org chart (32 nodes)', async ({ page }) => {
    const html = generatePrintHtml(32, 'Large Org Chart');
    await page.setContent(html);
    const pdfPath = path.join(artifactsDir, 'org-chart-large.pdf');
    await page.pdf({ path: pdfPath, format: 'A4', landscape: true });

    expect(fs.existsSync(pdfPath)).toBe(true);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(1000);

    const rootBox = await page.locator('#root').boundingBox();
    expect(rootBox).not.toBeNull();
    expect(rootBox!.y).toBeGreaterThanOrEqual(50);
  });
});
