import React from 'react';
import { ArrowLeft, BookOpen, Clock, Calendar, User } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { fieldNotes, FieldNote } from '../../data/fieldNotes';
import CTASection from './CTASection';

interface PublicFieldNotesProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function PublicFieldNotes({ currentPath, onNavigate }: PublicFieldNotesProps) {
  // Extract slug if viewing specific post, e.g. /field-notes/slug
  const slugMatch = currentPath.match(/^\/field-notes\/([^/]+)$/);
  const activeSlug = slugMatch ? slugMatch[1] : null;
  const activePost = activeSlug ? fieldNotes.find(n => n.slug === activeSlug) : null;

  const handlePostClick = (slug: string) => {
    onNavigate(`/field-notes/${slug}`);
  };

  const handleBackToList = () => {
    onNavigate('/field-notes');
  };

  if (activePost) {
    return (
      <div className="py-10 md:py-16 text-left font-sans">
        <article className="px-6 md:px-12 max-w-3xl mx-auto space-y-8">
          {/* Back button */}
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer border-none bg-transparent p-0 focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Field Notes</span>
          </button>

          {/* Article Header Metadata */}
          <div className="space-y-4 border-b border-border-soft pb-6">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-text-primary tracking-tight leading-tight">
              {activePost.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-primary/60" />
                {activePost.date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-brand-primary/60" />
                By {activePost.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-primary/60" />
                {activePost.readingTime}
              </span>
            </div>
          </div>

          {/* Article markdown body rendering */}
          <div 
            className="prose prose-stone max-w-none text-sm md:text-base text-text-secondary font-sans font-light leading-relaxed space-y-6 pt-4"
          >
            {activePost.content.split('\n\n').map((paragraph, pIdx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-lg md:text-xl font-serif font-bold text-text-primary pt-4 pb-2 border-b border-border-soft/40">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('* ')) {
                return (
                  <ul key={pIdx} className="list-disc pl-5 space-y-1">
                    {paragraph.split('\n').map((li, liIdx) => (
                      <li key={liIdx} className="text-xs md:text-sm font-light">
                        {li.replace('* ', '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.startsWith('|')) {
                const rows = paragraph.split('\n').filter(Boolean);
                return (
                  <div key={pIdx} className="overflow-x-auto my-6 border border-border-soft rounded-xl">
                    <table className="min-w-full divide-y divide-border-soft text-left text-xs md:text-sm">
                      <tbody className="divide-y divide-border-soft bg-surface">
                        {rows.map((row, rIdx) => {
                          const cells = row.split('|').filter((_, cIdx) => cIdx > 0 && cIdx < row.split('|').length - 1);
                          if (row.includes('---')) return null;
                          return (
                            <tr key={rIdx} className={rIdx === 0 ? "bg-stone-50/50 font-bold" : ""}>
                              {cells.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-2.5 font-light">
                                  {cell.trim()}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <p key={pIdx} className="whitespace-pre-line">
                  {/* Handle bold markdown */}
                  {paragraph.split('**').map((part, partIdx) => 
                    partIdx % 2 === 1 ? <strong key={partIdx} className="font-bold text-text-primary">{part}</strong> : part
                  )}
                </p>
              );
            })}
          </div>

          <div className="border-t border-border-soft pt-12 mt-12 flex justify-between items-center">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer border border-border-soft px-4 py-2 rounded-lg bg-surface shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Field Notes</span>
            </button>
            <button
              onClick={() => onNavigate('/discovery')}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg shadow-sm"
            >
              Request Discovery
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-16 md:space-y-24 py-10 md:py-16 text-left font-sans">
      
      {/* 2. GRID LISTING SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Field Notes"
          title="Insights on how businesses actually operate."
          subtitle="Our collection of essays documenting common friction patterns, the limits of artificial intelligence, and the principles of calm operations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border-soft/60">
          {fieldNotes.map((post) => (
            <div 
              key={post.id}
              onClick={() => handlePostClick(post.slug)}
              className="p-6 bg-surface border border-border-soft hover:border-brand-primary/45 rounded-[24px] shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer group text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-primary/60" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-primary/60" />
                    {post.readingTime}
                  </span>
                </div>
                
                <h3 className="text-xl font-serif font-bold text-text-primary group-hover:text-brand-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
                  {post.summary}
                </p>
              </div>
              
              <div className="pt-6 mt-4 border-t border-border-soft/60 flex items-center justify-between text-xs font-bold text-brand-primary group-hover:text-brand-primary-hover">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Article</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FINAL CTA */}
      <section className="px-6 md:px-12">
        <CTASection onNavigate={onNavigate} />
      </section>
      
    </div>
  );
}
