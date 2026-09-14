import React from 'react';

interface HighlightMatchProps {
  text?: string | null;
  query?: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Escapes regex special characters to prevent ReDoS or syntax errors.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safe React-based search text highlighter.
 * Splits text around matched query segments and renders non-dangerous React nodes.
 */
export function HighlightMatch({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-100 text-amber-950 font-semibold px-0.5 rounded',
}: HighlightMatchProps) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const cleanQuery = query.trim();
  const escaped = escapeRegExp(cleanQuery);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length <= 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === cleanQuery.toLowerCase();
        if (isMatch) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
