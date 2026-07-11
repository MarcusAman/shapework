import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeader({ eyebrow, title, subtitle, centered = false }: SectionHeaderProps) {
  return (
    <div className={`max-w-3xl mb-12 ${centered ? 'text-center mx-auto' : 'text-left'}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary block mb-3">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-text-primary tracking-tight leading-[1.15] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-text-secondary font-sans font-light leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
