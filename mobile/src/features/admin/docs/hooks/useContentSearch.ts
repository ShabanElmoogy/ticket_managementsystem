import { useMemo } from 'react';
import type { Doc, DocBlock } from '../types/types';

export interface SearchMatch {
  docId: string;
  docTitle: string;
  blockId: string;
  blockType: DocBlock['type'];
  snippet: string;   // text excerpt containing the match
}

/** Strip basic HTML tags for plain-text matching */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extract searchable plain text from any block */
function extractBlockText(block: DocBlock): string {
  switch (block.type) {
    case 'heading':      return block.text;
    case 'text':         return stripHtml(block.html);
    case 'quote':        return [block.text, block.attribution].filter(Boolean).join(' ');
    case 'callout':      return block.text;
    case 'code':         return block.code;
    case 'toggle':       return [block.summary, block.content].filter(Boolean).join(' ');
    case 'bulletedList':
    case 'numberedList': return [block.title, ...(block.items ?? [])].filter(Boolean).join(' ');
    case 'table':        return [...(block.headers ?? []), ...(block.rows ?? []).flat()].join(' ');
    case 'tabs':         return (block.tabs ?? []).map((t) => `${t.label} ${t.content}`).join(' ');
    case 'image':
    case 'video':        return block.caption ?? '';
    case 'pdf':
    case 'excel':        return block.name ?? '';
    default:             return '';
  }
}

/** Build a short snippet around the match position */
function buildSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx   = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 80);
  const start = Math.max(0, idx - 30);
  const end   = Math.min(text.length, idx + query.length + 50);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

export function useContentSearch(docs: Doc[], query: string): SearchMatch[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: SearchMatch[] = [];

    for (const doc of docs) {
      for (const block of doc.blocks ?? []) {
        const text = extractBlockText(block);
        if (!text) continue;
        if (text.toLowerCase().includes(q)) {
          results.push({
            docId:     doc.id,
            docTitle:  doc.title,
            blockId:   block.id,
            blockType: block.type,
            snippet:   buildSnippet(text, q),
          });
        }
      }
    }

    return results;
  }, [docs, query]);
}
