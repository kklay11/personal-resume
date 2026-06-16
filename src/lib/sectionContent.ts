import type { ResumeSection, SectionItem, SectionValue } from '../types';
import { normalizeMultilineValue } from './markdown';

export const asText = (value: SectionValue | undefined) => (typeof value === 'string' ? value : '');

export const itemHasContent = (item: SectionItem) =>
  Object.values(item).some((value) =>
    Array.isArray(value) ? value.some((entry) => entry.trim()) : value.trim(),
  );

export const getVisibleItems = (section: ResumeSection) => section.items.filter(itemHasContent);

export const sectionHasContent = (section: ResumeSection) => section.items.some(itemHasContent);

export const isContinuationItem = (item: SectionItem) => asText(item.__continuation) === '1';

export const getDescriptionText = (item: SectionItem) =>
  normalizeMultilineValue(item.description).trim();

export const isCompactTextSection = (type: ResumeSection['type']) =>
  type === 'campus' || type === 'certificates';

export const isTitleEditableSection = (section: ResumeSection) =>
  section.type === 'projects' || Boolean(section.custom);
