import type { ResumeSection, SectionItem } from '../types';
import { renderMarkdownBlocks, renderMultilineInline } from '../lib/markdown';
import {
  asText,
  getDescriptionText,
  isCompactTextSection,
  isContinuationItem,
} from '../lib/sectionContent';

interface ResumeItemProps {
  section: ResumeSection;
  item: SectionItem;
  index: number;
}

// Single source of truth for rendering one resume item. Used both for the live
// preview and the hidden measure pass, which guarantees the heights measured for
// pagination match exactly what gets painted.
export const ResumeItem = ({ section, item, index }: ResumeItemProps) => {
  if (section.type === 'education') {
    return (
      <article className="education-row">
        <div>
          {!isContinuationItem(item) ? (
            <strong>
              {[asText(item.school), asText(item.major), asText(item.degree)].filter(Boolean).join('  ')}
            </strong>
          ) : null}
          {renderMarkdownBlocks(item.description, `${section.id}-${index}-education`)}
        </div>
        {!isContinuationItem(item) ? <span>{asText(item.dateRange)}</span> : null}
      </article>
    );
  }

  if (section.type === 'skills') {
    return (
      <div className="skill-block">
        {renderMarkdownBlocks(item.content, `${section.id}-${index}-skills`)}
      </div>
    );
  }

  if (section.type === 'summary') {
    return <div className="paragraph-block">{renderMarkdownBlocks(item.content, `${section.id}-${index}-summary`)}</div>;
  }

  const title = asText(item.name) || asText(item.company);
  const subtitle = asText(item.role) || asText(item.subtitle) || asText(item.issuer);
  const descriptionText = getDescriptionText(item);
  const continuation = isContinuationItem(item);

  if (section.type === 'awards') {
    return (
      <article className="timeline-card timeline-card--plain">
        {renderMarkdownBlocks(item.description, `${section.id}-${index}-description`)}
      </article>
    );
  }

  if (isCompactTextSection(section.type)) {
    return (
      <article className="compact-entry" data-index={index}>
        <div className="compact-entry__main">
          {!continuation ? <strong>{[title, subtitle].filter(Boolean).join(' ｜ ') || section.title}</strong> : null}
          {descriptionText ? (
            <span>{renderMultilineInline(descriptionText.replace(/\n+/g, '；'), `${section.id}-${index}-compact`)}</span>
          ) : null}
        </div>
        {!continuation && asText(item.dateRange) ? <span className="compact-entry__date">{asText(item.dateRange)}</span> : null}
      </article>
    );
  }

  return (
    <article className="timeline-card" data-index={index}>
      {!continuation ? (
        <>
          <div className="timeline-card__headline">
            <strong>{title || section.title}</strong>
            <span>{asText(item.dateRange)}</span>
          </div>
          {subtitle ? <div className="timeline-card__subline">{subtitle}</div> : null}
        </>
      ) : null}
      {renderMarkdownBlocks(item.description, `${section.id}-${index}-description`)}
    </article>
  );
};
