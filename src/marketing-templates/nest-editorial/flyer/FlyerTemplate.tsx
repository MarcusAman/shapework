import React from 'react';
import { FlyerTemplateContent } from '../types';
import { NEST_TOKENS } from '../tokens';

/**
 * Nest Editorial V1 Property Flyer Component (Variant A - Editorial Hero)
 * Designed for 8.5" x 11" (Letter, 612pt x 792pt) print & PDF output.
 */
export const FlyerTemplate: React.FC<{ content: FlyerTemplateContent }> = ({ content }) => {
  const {
    brandName,
    subBrand = 'LUXURY COASTAL COLLECTION',
    eyebrow,
    headline,
    address,
    cityStateZip,
    priceFormatted,
    facts,
    heroPhoto,
    featuresTitle = 'VERIFIED PROPERTY HIGHLIGHTS',
    features,
    agent,
    legal,
  } = content;

  return (
    <div
      style={{
        width: NEST_TOKENS.dimensions.flyerWidth,
        height: NEST_TOKENS.dimensions.flyerHeight,
        backgroundColor: NEST_TOKENS.colors.paper,
        color: NEST_TOKENS.colors.ink,
        fontFamily: NEST_TOKENS.fonts.body,
        padding: '24pt 28pt 18pt 28pt',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1. TOP BRAND BAND */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingBottom: '10pt',
          borderBottom: `1.5pt solid ${NEST_TOKENS.colors.forest}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
          <span
            style={{
              fontSize: '8.5pt',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: NEST_TOKENS.colors.emerald,
            }}
          >
            {eyebrow || 'JUST LISTED'}
          </span>
          <h2
            style={{
              fontFamily: NEST_TOKENS.fonts.display,
              fontSize: '14pt',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: NEST_TOKENS.colors.forest,
            }}
          >
            {brandName.toUpperCase()}
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '22pt',
              fontWeight: 800,
              color: NEST_TOKENS.colors.forest,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {priceFormatted}
          </div>
        </div>
      </div>

      {/* 2. PROPERTY INTRODUCTION */}
      <div style={{ marginTop: '10pt', marginBottom: '10pt' }}>
        <h1
          style={{
            fontFamily: NEST_TOKENS.fonts.display,
            fontSize: '23pt',
            fontWeight: 700,
            color: NEST_TOKENS.colors.forest,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}
        >
          {headline}
        </h1>
        <div
          style={{
            fontSize: '11pt',
            fontWeight: 600,
            color: NEST_TOKENS.colors.muted,
            marginTop: '4pt',
            letterSpacing: '0.02em',
          }}
        >
          {address}, {cityStateZip}
        </div>
      </div>

      {/* 3. HERO PHOTOGRAPH */}
      <div
        style={{
          width: '100%',
          height: '330pt',
          position: 'relative',
          backgroundColor: NEST_TOKENS.colors.mist,
          borderRadius: '2pt',
          overflow: 'hidden',
          border: `1pt solid ${NEST_TOKENS.colors.rule}`,
          marginBottom: '10pt',
        }}
      >
        <img
          src={heroPhoto.url}
          alt={heroPhoto.altText || headline}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* 4. FACTS STRIP */}
      <div
        style={{
          backgroundColor: NEST_TOKENS.colors.mist,
          borderTop: `1pt solid ${NEST_TOKENS.colors.rule}`,
          borderBottom: `1pt solid ${NEST_TOKENS.colors.rule}`,
          padding: '8pt 14pt',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          marginBottom: '12pt',
        }}
      >
        {facts.map((fact, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span style={{ color: NEST_TOKENS.colors.pistachio, fontSize: '12pt', fontWeight: 300 }}>
                •
              </span>
            )}
            <span
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                color: NEST_TOKENS.colors.forest,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {fact.value} {fact.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* 5. FEATURE AND AGENT AREA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.65fr 1fr',
          gap: '16pt',
          alignItems: 'start',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
          <h3
            style={{
              fontFamily: NEST_TOKENS.fonts.display,
              fontSize: '11pt',
              fontWeight: 700,
              color: NEST_TOKENS.colors.forest,
              letterSpacing: '0.03em',
              borderBottom: `1pt solid ${NEST_TOKENS.colors.rule}`,
              paddingBottom: '3pt',
              marginBottom: '2pt',
            }}
          >
            {featuresTitle}
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4.5pt' }}>
            {features.map((feat, idx) => (
              <li key={idx} style={{ fontSize: '9pt', color: NEST_TOKENS.colors.ink, lineHeight: 1.35, display: 'flex', gap: '6pt' }}>
                <span style={{ color: NEST_TOKENS.colors.emerald, fontWeight: 800 }}>•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            backgroundColor: NEST_TOKENS.colors.mist,
            border: `1pt solid ${NEST_TOKENS.colors.rule}`,
            borderRadius: '4pt',
            padding: '10pt 12pt',
            display: 'flex',
            flexDirection: 'column',
            gap: '3pt',
          }}
        >
          <div style={{ fontFamily: NEST_TOKENS.fonts.display, fontSize: '12pt', fontWeight: 700, color: NEST_TOKENS.colors.forest }}>
            {agent.name}
          </div>
          <div style={{ fontSize: '8.5pt', fontWeight: 600, color: NEST_TOKENS.colors.emerald }}>
            {agent.title}
          </div>
          <div style={{ fontSize: '8pt', color: NEST_TOKENS.colors.muted }}>
            {agent.office}
          </div>
          <div style={{ fontSize: '9pt', fontWeight: 700, color: NEST_TOKENS.colors.forest, marginTop: '4pt', paddingTop: '4pt', borderTop: '1pt solid rgba(1, 54, 45, 0.12)' }}>
            {agent.phone} • {agent.email}
          </div>
        </div>
      </div>

      {/* 6. FOOTER LEGAL ZONE */}
      <div
        style={{
          borderTop: `1pt solid ${NEST_TOKENS.colors.rule}`,
          paddingTop: '6pt',
          marginTop: '8pt',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '7.5pt',
          color: NEST_TOKENS.colors.muted,
        }}
      >
        <div>
          NCREC License #{legal.ncrecLicense} • {legal.equalHousingText} • {legal.disclaimer}
        </div>
        <div style={{ fontFamily: NEST_TOKENS.fonts.display, fontSize: '8.5pt', fontWeight: 700, color: NEST_TOKENS.colors.forest, letterSpacing: '0.05em' }}>
          NEST REALTY
        </div>
      </div>
    </div>
  );
};

/**
 * Pure HTML String Generator for Node / Puppeteer / Chromium PDF Rendering
 */
export function generateNestEditorialFlyerHtml(content: FlyerTemplateContent): string {
  const {
    brandName,
    eyebrow = 'JUST LISTED',
    headline,
    address,
    cityStateZip,
    priceFormatted,
    facts,
    heroPhoto,
    featuresTitle = 'VERIFIED PROPERTY HIGHLIGHTS',
    features,
    agent,
    legal,
  } = content;

  const factsHtml = facts
    .map(
      (f, i) =>
        `${i > 0 ? `<span class="fact-divider">•</span>` : ''}<span class="fact-item">${f.value} ${f.label}</span>`
    )
    .join('');

  const featuresHtml = features
    .map((feat) => `<li class="feature-item"><span class="feature-bullet">•</span><span>${feat}</span></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${headline} - Nest Editorial Flyer</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 612pt;
      height: 792pt;
      background-color: #FFFDF8;
      color: #10201B;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      position: relative;
      overflow: hidden;
      padding: 24pt 28pt 18pt 28pt;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand-band {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding-bottom: 8pt;
      border-bottom: 1.5pt solid #01362D;
    }
    .brand-eyebrow {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #00635C;
    }
    .brand-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #01362D;
      margin-top: 2pt;
    }
    .price-display {
      font-size: 22pt;
      font-weight: 800;
      color: #01362D;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .intro-zone {
      margin-top: 10pt;
      margin-bottom: 10pt;
    }
    .headline-main {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22pt;
      font-weight: 700;
      color: #01362D;
      line-height: 1.15;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }
    .address-sub {
      font-size: 11pt;
      font-weight: 600;
      color: #68736E;
      margin-top: 4pt;
      letter-spacing: 0.02em;
    }
    .hero-container {
      width: 100%;
      height: 330pt;
      position: relative;
      background-color: #F6F7F1;
      border-radius: 2pt;
      overflow: hidden;
      border: 1pt solid rgba(1, 54, 45, 0.16);
      margin-bottom: 10pt;
    }
    .hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .facts-strip {
      background-color: #F6F7F1;
      border-top: 1pt solid rgba(1, 54, 45, 0.16);
      border-bottom: 1pt solid rgba(1, 54, 45, 0.16);
      padding: 8pt 14pt;
      display: flex;
      align-items: center;
      justify-content: space-around;
      margin-bottom: 10pt;
    }
    .fact-item {
      font-size: 9.5pt;
      font-weight: 700;
      color: #01362D;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .fact-divider {
      color: #D0D6BB;
      font-size: 12pt;
      font-weight: 300;
    }
    .body-grid {
      display: grid;
      grid-template-columns: 1.65fr 1fr;
      gap: 16pt;
      align-items: start;
      flex: 1;
    }
    .features-column {
      display: flex;
      flex-direction: column;
      gap: 4pt;
    }
    .features-header {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #01362D;
      letter-spacing: 0.03em;
      border-bottom: 1pt solid rgba(1, 54, 45, 0.16);
      padding-bottom: 3pt;
      margin-bottom: 4pt;
    }
    .features-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4.5pt;
    }
    .feature-item {
      font-size: 9pt;
      color: #10201B;
      line-height: 1.35;
      display: flex;
      gap: 6pt;
    }
    .feature-bullet {
      color: #00635C;
      font-weight: 800;
    }
    .agent-card {
      background-color: #F6F7F1;
      border: 1pt solid rgba(1, 54, 45, 0.16);
      border-radius: 4pt;
      padding: 10pt 12pt;
      display: flex;
      flex-direction: column;
      gap: 3pt;
    }
    .agent-name {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      font-weight: 700;
      color: #01362D;
    }
    .agent-title {
      font-size: 8.5pt;
      font-weight: 600;
      color: #00635C;
    }
    .agent-office {
      font-size: 8pt;
      color: #68736E;
    }
    .agent-contact {
      font-size: 9pt;
      font-weight: 700;
      color: #01362D;
      margin-top: 4pt;
      padding-top: 4pt;
      border-top: 1pt solid rgba(1, 54, 45, 0.12);
    }
    .footer-legal {
      border-top: 1pt solid rgba(1, 54, 45, 0.16);
      padding-top: 6pt;
      margin-top: 6pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #68736E;
    }
    .footer-brand {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #01362D;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body class="nest-flyer-body">
  <div>
    <!-- 1. TOP BRAND BAND -->
    <div class="brand-band">
      <div>
        <div class="brand-eyebrow">${eyebrow}</div>
        <div class="brand-title">${brandName.toUpperCase()}</div>
      </div>
      <div>
        <div class="price-display">${priceFormatted}</div>
      </div>
    </div>

    <!-- 2. PROPERTY INTRODUCTION -->
    <div class="intro-zone">
      <h1 class="headline-main">${headline}</h1>
      <div class="address-sub">${address}, ${cityStateZip}</div>
    </div>

    <!-- 3. HERO PHOTOGRAPH -->
    <div class="hero-container">
      <img class="hero-img" src="${heroPhoto.url}" alt="${heroPhoto.altText || headline}" />
    </div>

    <!-- 4. FACTS STRIP -->
    <div class="facts-strip">
      ${factsHtml}
    </div>

    <!-- 5. FEATURE AND AGENT AREA -->
    <div class="body-grid">
      <div class="features-column">
        <div class="features-header">${featuresTitle}</div>
        <ul class="features-list">
          ${featuresHtml}
        </ul>
      </div>

      <div class="agent-card">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-title">${agent.title}</div>
        <div class="agent-office">${agent.office}</div>
        <div class="agent-contact">${agent.phone} • ${agent.email}</div>
      </div>
    </div>
  </div>

  <!-- 6. FOOTER LEGAL ZONE -->
  <div class="footer-legal">
    <div>NCREC License #${legal.ncrecLicense} • ${legal.equalHousingText} • ${legal.disclaimer}</div>
    <div class="footer-brand">NEST REALTY</div>
  </div>
</body>
</html>`;
}
