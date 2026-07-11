import React from 'react';

interface Belief {
  quote: string;
  explanation: string;
}

export default function BeliefCard() {
  const beliefs: Belief[] = [
    {
      quote: "Less software, not more.",
      explanation: "Buying a new software subscription rarely fixes a broken process. Operations are cleaned by designing better handoffs and standardizing behavior, not by adding more tabs."
    },
    {
      quote: "AI is a tool, not a strategy.",
      explanation: "AI works where it earns its place—classifying documents, detecting errors, or drafting responses. Pointing an LLM at an unstructured process just generates faster errors."
    },
    {
      quote: "Operations is a design discipline.",
      explanation: "Like building a premium physical object, building an operational flow requires extreme restraint, precise boundaries, and progressive detail disclosure."
    },
    {
      quote: "Adoption is the work.",
      explanation: "A workflow plan is useless if your coordinators find it tedious and your agents bypass it. The system must adapt to how people work, not the other way around."
    },
    {
      quote: "The best workflow is the one you stop noticing.",
      explanation: "Operations shouldn't require heroics or continuous Slack coordination. It should run quietly in the background, only calling for human attention when a true exception arises."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
      {beliefs.map((belief, idx) => (
        <div 
          key={idx}
          className="p-6 md:p-8 bg-surface-soft border border-border-soft rounded-2xl flex flex-col justify-between text-left shadow-sm hover:border-brand-primary/20 transition-all duration-300"
        >
          <div className="space-y-4">
            <span className="text-[9px] font-mono text-brand-primary uppercase tracking-widest block">
              Belief 0{idx + 1}
            </span>
            <blockquote className="text-lg md:text-xl font-serif font-medium italic text-text-primary leading-tight">
              "{belief.quote}"
            </blockquote>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light pt-2">
              {belief.explanation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
