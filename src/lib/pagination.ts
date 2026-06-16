import {
  RESUME_HEADER_GAP,
  RESUME_ITEM_GAP,
  RESUME_PAGE_BOTTOM_BUFFER,
  RESUME_PAGE_HEIGHT,
  RESUME_TITLE_GAP,
} from '../constants';
import type { ResumeData, ResumeSection, SectionItem } from '../types';
import { normalizeMultilineValue } from './markdown';
import { asText, getVisibleItems } from './sectionContent';

export interface PreviewPage {
  id: string;
  showHeader: boolean;
  sections: ResumeSection[];
}

// Rough height estimate used before the hidden measure pass has reported real
// offsets, so the first paint still produces sensible page breaks.
export const estimateSectionWeight = (section: ResumeSection, resume: ResumeData) => {
  const titleWeight = resume.settings.sectionTitleSize + 30;

  const itemWeight = section.items.reduce((total, item) => {
    const textLength = Object.values(item).reduce((sum, value) => {
      if (Array.isArray(value)) {
        return sum + value.join('').length;
      }

      return sum + value.length;
    }, 0);

    const lines = Math.max(1, Math.ceil(textLength / 46));
    return total + lines * resume.settings.contentFontSize * resume.settings.lineHeight + 36;
  }, 0);

  return titleWeight + itemWeight + resume.settings.sectionGap;
};

// Split a multiline description/content value into paragraph + list chunks so a
// long item can flow across page boundaries.
const chunkMarkdownValue = (value: string) => {
  const normalized = value.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    chunks.push(paragraphLines.join('\n'));
    paragraphLines = [];
  };

  normalized.split('\n').forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      chunks.push(trimmed);
      return;
    }

    paragraphLines.push(line);
  });

  flushParagraph();

  return chunks.length > 0 ? chunks : [normalized];
};

const splitItemForPagination = (
  section: ResumeSection,
  item: SectionItem,
  itemIndex: number,
): SectionItem[] => {
  const targetKey = section.type === 'skills' || section.type === 'summary' ? 'content' : 'description';
  const value = normalizeMultilineValue(item[targetKey]);
  const chunks = chunkMarkdownValue(value);

  if (chunks.length <= 1) {
    return [{ ...item, __measureId: `${section.id}-${itemIndex}-0` }];
  }

  return chunks.map((chunk, chunkIndex) => ({
    ...item,
    [targetKey]: chunk,
    dateRange: chunkIndex === 0 ? item.dateRange ?? '' : '',
    __continuation: chunkIndex === 0 ? '' : '1',
    __measureId: `${section.id}-${itemIndex}-${chunkIndex}`,
  }));
};

export const prepareSectionForPagination = (section: ResumeSection): ResumeSection => ({
  ...section,
  items: section.items.flatMap((item, itemIndex) => splitItemForPagination(section, item, itemIndex)),
});

interface PaginateOptions {
  sections: ResumeSection[];
  resume: ResumeData;
  measuredHeaderHeight: number | null;
  getMeasuredTitleHeight: (sectionId: string) => number | undefined;
  getMeasuredItemHeight: (measureId: string) => number | undefined;
}

// Greedy page-packer: walks the prepared sections and slices each into fragments
// that fit the remaining height on the current page, opening new pages as needed.
export const paginateSections = ({
  sections,
  resume,
  measuredHeaderHeight,
  getMeasuredTitleHeight,
  getMeasuredItemHeight,
}: PaginateOptions): PreviewPage[] => {
  const pageCapacity =
    RESUME_PAGE_HEIGHT -
    resume.settings.pageMarginTop -
    resume.settings.pageMarginBottom -
    RESUME_PAGE_BOTTOM_BUFFER;
  const headerHeight =
    resume.settings.showProfileHeader && measuredHeaderHeight != null
      ? measuredHeaderHeight + RESUME_HEADER_GAP
      : 0;

  const resolveItemHeight = (section: ResumeSection, item: SectionItem, itemIndex: number) => {
    const measureId = asText(item?.__measureId) || `${section.id}-${itemIndex}`;
    return (
      getMeasuredItemHeight(measureId) ?? estimateSectionWeight({ ...section, items: [item] }, resume)
    );
  };

  const pages: PreviewPage[] = [];
  let currentSections: ResumeSection[] = [];
  let currentHeight = 0;
  let currentCapacity = Math.max(420, pageCapacity - headerHeight);

  const pushPage = () => {
    pages.push({
      id: `page-${pages.length + 1}`,
      showHeader: pages.length === 0 && resume.settings.showProfileHeader,
      sections: currentSections,
    });
    currentSections = [];
    currentHeight = 0;
    currentCapacity = Math.max(420, pageCapacity);
  };

  sections.forEach((section) => {
    const items = getVisibleItems(section);
    const titleHeight =
      (getMeasuredTitleHeight(section.id) ?? resume.settings.sectionTitleSize + 18) + RESUME_TITLE_GAP;

    if (items.length === 0) {
      return;
    }

    let itemIndex = 0;
    let fragmentIndex = 0;

    while (itemIndex < items.length) {
      const nextItemHeight = resolveItemHeight(section, items[itemIndex], itemIndex);

      if (
        currentSections.length > 0 &&
        currentHeight + titleHeight + nextItemHeight + resume.settings.sectionGap > currentCapacity
      ) {
        pushPage();
      }

      const fragmentItems: SectionItem[] = [];
      let fragmentHeight = titleHeight;

      while (itemIndex < items.length) {
        const itemHeight = resolveItemHeight(section, items[itemIndex], itemIndex);
        const blockHeight =
          fragmentHeight +
          itemHeight +
          (fragmentItems.length > 0 ? RESUME_ITEM_GAP : 0) +
          resume.settings.sectionGap;

        if (fragmentItems.length > 0 && currentHeight + blockHeight > currentCapacity) {
          break;
        }

        if (
          fragmentItems.length === 0 &&
          currentSections.length === 0 &&
          currentHeight + blockHeight > currentCapacity
        ) {
          fragmentItems.push(items[itemIndex]);
          fragmentHeight += itemHeight;
          itemIndex += 1;
          break;
        }

        fragmentItems.push(items[itemIndex]);
        fragmentHeight += itemHeight + (fragmentItems.length > 1 ? RESUME_ITEM_GAP : 0);
        itemIndex += 1;
      }

      currentSections.push({
        ...section,
        id: `${section.id}-fragment-${fragmentIndex}`,
        items: fragmentItems,
      });
      currentHeight += fragmentHeight + resume.settings.sectionGap;
      fragmentIndex += 1;

      if (itemIndex < items.length) {
        pushPage();
      }
    }
  });

  if (currentSections.length > 0 || pages.length === 0) {
    pushPage();
  }

  return pages;
};
