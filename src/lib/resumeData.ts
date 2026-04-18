import { createDefaultResume, createEmptyItem, getSectionSchema } from '../resumeConfig';
import type { ResumeData, ResumeSection, SectionItem, SectionType } from '../types';

export const CURRENT_RESUME_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeItems = (type: SectionType, items: unknown): SectionItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return [createEmptyItem(type)];
  }

  return items
    .filter(isRecord)
    .map((item) => {
      const emptyItem = createEmptyItem(type);
      const nextItem: SectionItem = { ...emptyItem };

      Object.entries(item).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          nextItem[key] = value.filter((entry): entry is string => typeof entry === 'string');
          return;
        }

        if (typeof value === 'string') {
          nextItem[key] = value;
        }
      });

      return nextItem;
    });
};

const normalizeSections = (sections: unknown, baseSections: ResumeSection[]): ResumeSection[] => {
  if (!Array.isArray(sections)) {
    return baseSections;
  }

  return sections
    .filter(isRecord)
    .map((section) => {
      const rawType = section.type;
      const type = typeof rawType === 'string' ? (rawType as SectionType) : 'custom';
      const schema = getSectionSchema(type);

      return {
        id: typeof section.id === 'string' ? section.id : `${type}-${crypto.randomUUID?.() ?? Date.now()}`,
        type,
        title: typeof section.title === 'string' && section.title.trim() ? section.title : schema.title,
        enabled: typeof section.enabled === 'boolean' ? section.enabled : true,
        custom: typeof section.custom === 'boolean' ? section.custom : type === 'custom',
        items: normalizeItems(type, section.items),
      };
    });
};

export const migrateResumeData = (raw: unknown): Partial<ResumeData> => {
  if (!isRecord(raw)) {
    return {};
  }

  return {
    ...raw,
    schemaVersion: CURRENT_RESUME_SCHEMA_VERSION,
  } as Partial<ResumeData>;
};

export const normalizeResumeData = (raw: unknown): ResumeData => {
  const baseResume = createDefaultResume();
  const migrated = migrateResumeData(raw);

  return {
    ...baseResume,
    ...migrated,
    schemaVersion: CURRENT_RESUME_SCHEMA_VERSION,
    personalInfo: {
      ...baseResume.personalInfo,
      ...(isRecord(migrated.personalInfo) ? migrated.personalInfo : {}),
    },
    settings: {
      ...baseResume.settings,
      ...(isRecord(migrated.settings) ? migrated.settings : {}),
    },
    sections: normalizeSections(migrated.sections, baseResume.sections),
    updatedAt: typeof migrated.updatedAt === 'string' ? migrated.updatedAt : baseResume.updatedAt,
  };
};

export const deriveResumeTitle = (resume: ResumeData) =>
  `${resume.personalInfo.fullName || '未命名'}的简历`;
