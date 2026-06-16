import type { ReactNode } from 'react';
import type { SectionValue } from '../types';

export const normalizeMultilineValue = (value: SectionValue | undefined) => {
  if (Array.isArray(value)) {
    return value.join('\n');
  }

  return typeof value === 'string' ? value.replace(/\r\n/g, '\n') : '';
};

const renderInlineMarkdown = (value: string, keyPrefix: string): ReactNode[] =>
  value
    .split(/(\*\*.*?\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
      }

      return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
    });

export const renderMultilineInline = (value: string, keyPrefix: string): ReactNode[] =>
  value.split('\n').flatMap((line, index, lines) => {
    const nodes: ReactNode[] = renderInlineMarkdown(line, `${keyPrefix}-line-${index}`);

    if (index < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
    }

    return nodes;
  });

export const renderMarkdownBlocks = (value: SectionValue | undefined, keyPrefix: string) => {
  const normalized = normalizeMultilineValue(value).trim();

  if (!normalized) {
    return null;
  }

  const blocks: ReactNode[] = [];
  const lines = normalized.split('\n');
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push(
      <p key={`${keyPrefix}-paragraph-${blocks.length}`} className="markdown-paragraph">
        {renderMultilineInline(paragraphLines.join('\n'), `${keyPrefix}-paragraph-${blocks.length}`)}
      </p>,
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`${keyPrefix}-list-${blocks.length}`} className="markdown-list">
        {listItems.map((item, index) => (
          <li key={`${keyPrefix}-item-${index}`}>{renderMultilineInline(item, `${keyPrefix}-item-${index}`)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }

    flushList();
    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
};
