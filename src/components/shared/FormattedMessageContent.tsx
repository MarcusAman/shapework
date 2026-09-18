import React from 'react';

interface FormattedMessageContentProps {
  text: string;
  className?: string;
  isAgent?: boolean;
  suggestedActions?: {
    id: string;
    label: string;
    actionType: string;
    icon?: string;
    payload?: any;
  }[];
  onActionClick?: (action: { id: string; label: string; actionType: string; payload?: any }) => void;
}

/**
 * Parses inline markdown tokens:
 * - Links: [label](url)
 * - Bold: **bold**
 * - Italic: *italic* or _italic_
 * - Code: `code`
 */
export function parseInlineMarkdown(text: string, isUser: boolean = false): React.ReactNode[] {
  if (!text) return [];

  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Regex to match markdown links, bold, italic, and inline code
  const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

    if (match.index > 0) {
      tokens.push(remaining.substring(0, match.index));
    }

    if (match[1]) {
      // Link: [label](url)
      const label = match[2];
      const url = match[3];
      const isExternal = url.startsWith('http://') || url.startsWith('https://');
      tokens.push(
        <a
          key={`link-${key++}`}
          href={url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={isUser 
            ? "text-emerald-200 font-semibold underline hover:text-white transition-colors"
            : "text-[#00635C] font-semibold underline hover:text-[#01362D] transition-colors"
          }
        >
          {label}
        </a>
      );
    } else if (match[4]) {
      // Bold: **bold**
      tokens.push(
        <strong 
          key={`bold-${key++}`} 
          className={isUser ? "font-bold text-white" : "font-bold text-stone-950"}
        >
          {match[5]}
        </strong>
      );
    } else if (match[6]) {
      // Italic: *italic*
      tokens.push(
        <em 
          key={`italic-${key++}`} 
          className={isUser ? "italic text-white/90" : "italic text-stone-700"}
        >
          {match[7]}
        </em>
      );
    } else if (match[8]) {
      // Code: `code`
      tokens.push(
        <code 
          key={`code-${key++}`} 
          className={isUser 
            ? "px-1.5 py-0.5 rounded bg-black/25 font-mono text-[11px] text-white border border-white/20"
            : "px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[11px] text-stone-800 border border-stone-200/60"
          }
        >
          {match[9]}
        </code>
      );
    }

    remaining = remaining.substring(match.index + match[0].length);
  }

  return tokens;
}

/**
 * FormattedMessageContent renders clean, readable conversational output.
 * It eliminates raw markdown symbols (###, ####, **, etc.) and renders
 * crisp headings, clean lists, tables, and highlighted metadata with proper color inheritance.
 */
export const FormattedMessageContent: React.FC<FormattedMessageContentProps> = ({
  text,
  className = '',
  isAgent = true,
  suggestedActions = [],
  onActionClick
}) => {
  if (!text) return null;

  const isUser = !isAgent;

  // Split lines
  const rawLines = text.split('\n');
  const blocks: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let blockKey = 0;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blockKey++}`} className="space-y-1 my-1.5 pl-1">
            {currentList.items.map((item, idx) => (
              <li 
                key={idx} 
                className={`flex items-start gap-2 text-[13px] leading-relaxed ${
                  isUser ? 'text-white' : 'text-stone-800'
                }`}
              >
                <span className={`${isUser ? 'text-emerald-200' : 'text-[#00635C]'} font-bold mt-1 text-[10px] select-none`}>•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`ol-${blockKey++}`} className="space-y-1 my-1.5 pl-1">
            {currentList.items.map((item, idx) => (
              <li 
                key={idx} 
                className={`flex items-start gap-2 text-[13px] leading-relaxed ${
                  isUser ? 'text-white' : 'text-stone-800'
                }`}
              >
                <span className={`${isUser ? 'text-emerald-200' : 'text-[#00635C]'} font-mono font-bold text-xs mt-0.5 select-none`}>{idx + 1}.</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      blocks.push(
        <div key={`table-${blockKey++}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="min-w-full text-left text-xs divide-y divide-slate-200">
            {currentTable.headers.length > 0 && (
              <thead className="bg-[#F7F8F5] text-slate-700 font-bold">
                <tr>
                  {currentTable.headers.map((h, idx) => (
                    <th key={idx} className="px-3 py-2 text-[11px] whitespace-nowrap">
                      {parseInlineMarkdown(h, isUser)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-[11.5px] whitespace-nowrap">
                      {parseInlineMarkdown(cell, isUser)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // Markdown Table Row: | Col 1 | Col 2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      // Separator row: | :--- | :--- |
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Heading 1 & 2: # Header, ## Header
    if (line.startsWith('# ') || line.startsWith('## ')) {
      flushList();
      const content = line.replace(/^#{1,2}\s+/, '');
      blocks.push(
        <h3 
          key={`h2-${blockKey++}`} 
          className={`font-bold text-[14px] mt-2 mb-1 ${
            isUser ? 'text-white' : 'text-[#01362D]'
          }`}
        >
          {parseInlineMarkdown(content, isUser)}
        </h3>
      );
      continue;
    }

    // Heading 3: ### Header
    if (line.startsWith('### ')) {
      flushList();
      const content = line.slice(4).trim();
      blocks.push(
        <div 
          key={`h3-${blockKey++}`} 
          className={`font-bold text-[13.5px] mt-2 mb-1 flex items-center gap-1.5 ${
            isUser ? 'text-white' : 'text-[#01362D]'
          }`}
        >
          {parseInlineMarkdown(content, isUser)}
        </div>
      );
      continue;
    }

    // Heading 4: #### Subheader
    if (line.startsWith('#### ')) {
      flushList();
      const content = line.slice(5).trim();
      blocks.push(
        <div 
          key={`h4-${blockKey++}`} 
          className={`font-bold text-xs uppercase tracking-wide mt-2 mb-0.5 ${
            isUser ? 'text-emerald-200' : 'text-stone-700'
          }`}
        >
          {parseInlineMarkdown(content, isUser)}
        </div>
      );
      continue;
    }

    // Unordered List item: - item, * item, • item
    const ulMatch = line.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      const itemContent = parseInlineMarkdown(ulMatch[1], isUser);
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemContent] };
      } else {
        currentList.items.push(itemContent);
      }
      continue;
    }

    // Ordered List item: 1. item, 2. item
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      const itemContent = parseInlineMarkdown(olMatch[1], isUser);
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [itemContent] };
      } else {
        currentList.items.push(itemContent);
      }
      continue;
    }

    // Regular paragraph or metadata line
    flushList();
    blocks.push(
      <p 
        key={`p-${blockKey++}`} 
        className={`text-[13px] leading-relaxed my-1 font-sans ${
          isUser ? 'text-white font-medium' : 'text-stone-800'
        }`}
      >
        {parseInlineMarkdown(line, isUser)}
      </p>
    );
  }

  flushList();
  flushTable();

  return (
    <div className={`space-y-1.5 ${className} ${isUser ? 'text-white' : ''}`}>
      {blocks}

      {/* Suggested 1-Click Interactive Action Chips */}
      {Array.isArray(suggestedActions) && suggestedActions.length > 0 && (
        <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap" data-testid="suggested-actions-container">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Quick Actions:</span>
          {suggestedActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                if (onActionClick) {
                  onActionClick(action);
                } else if (typeof window !== 'undefined') {
                  const evt = new CustomEvent('nora:quick-action', { detail: action });
                  window.dispatchEvent(evt);
                }
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white hover:bg-[#E5EFEA] text-[#00635C] hover:text-[#004d47] border border-slate-200 hover:border-[#A4D4CB] transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormattedMessageContent;
