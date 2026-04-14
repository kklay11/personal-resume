import { useEffect, useMemo, useState } from 'react';
import { createDefaultResume, createEmptyItem, createSection, getSectionSchema } from '../resumeConfig';
import type { ResumeData, ResumeSection, SectionType, SectionValue } from '../types';

const STORAGE_KEY = 'resume-builder:state:v2';

const loadResume = (): ResumeData => {
  const baseResume = createDefaultResume();

  if (typeof window === 'undefined') {
    return baseResume;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return baseResume;
  }

  try {
    const parsed = JSON.parse(raw) as ResumeData;
    return {
      ...baseResume,
      ...parsed,
      personalInfo: {
        ...baseResume.personalInfo,
        ...parsed.personalInfo,
      },
      settings: {
        ...baseResume.settings,
        ...parsed.settings,
      },
    };
  } catch {
    return baseResume;
  }
};

const touch = (resume: ResumeData): ResumeData => ({
  ...resume,
  updatedAt: new Date().toISOString(),
});

const updateSection = (
  sections: ResumeSection[],
  sectionId: string,
  updater: (section: ResumeSection) => ResumeSection,
) => sections.map((section) => (section.id === sectionId ? updater(section) : section));

export const useResumeBuilder = () => {
  const [resume, setResume] = useState<ResumeData>(loadResume);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  }, [resume]);

  const enabledSectionCount = useMemo(
    () => resume.sections.filter((section) => section.enabled).length,
    [resume.sections],
  );

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResume((prev) =>
      touch({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value,
        },
      }),
    );
  };

  const updateSetting = <K extends keyof ResumeData['settings']>(
    field: K,
    value: ResumeData['settings'][K],
  ) => {
    setResume((prev) =>
      touch({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: value,
        },
      }),
    );
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setResume((prev) =>
      touch({
        ...prev,
        sections: updateSection(prev.sections, sectionId, (section) => ({ ...section, title })),
      }),
    );
  };

  const toggleSection = (sectionId: string) => {
    setResume((prev) =>
      touch({
        ...prev,
        sections: updateSection(prev.sections, sectionId, (section) => ({
          ...section,
          enabled: !section.enabled,
        })),
      }),
    );
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setResume((prev) => {
      const currentIndex = prev.sections.findIndex((section) => section.id === sectionId);

      if (currentIndex < 0) {
        return prev;
      }

      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= prev.sections.length) {
        return prev;
      }

      const sections = [...prev.sections];
      const current = sections[currentIndex];

      if (!current) {
        return prev;
      }

      sections.splice(currentIndex, 1);
      sections.splice(nextIndex, 0, current);

      return touch({
        ...prev,
        sections,
      });
    });
  };

  const addSectionItem = (sectionId: string) => {
    setResume((prev) =>
      touch({
        ...prev,
        sections: updateSection(prev.sections, sectionId, (section) => {
          const schema = getSectionSchema(section.type);

          if (!schema.repeatable) {
            return section;
          }

          return {
            ...section,
            items: [...section.items, createEmptyItem(section.type)],
          };
        }),
      }),
    );
  };

  const removeSectionItem = (sectionId: string, itemIndex: number) => {
    setResume((prev) =>
      touch({
        ...prev,
        sections: updateSection(prev.sections, sectionId, (section) => ({
          ...section,
          items:
            section.items.length === 1
              ? [createEmptyItem(section.type)]
              : section.items.filter((_, index) => index !== itemIndex),
        })),
      }),
    );
  };

  const updateSectionField = (
    sectionId: string,
    itemIndex: number,
    fieldKey: string,
    value: SectionValue,
  ) => {
    setResume((prev) =>
      touch({
        ...prev,
        sections: updateSection(prev.sections, sectionId, (section) => ({
          ...section,
          items: section.items.map((item, index) =>
            index === itemIndex
              ? {
                  ...item,
                  [fieldKey]: value,
                }
              : item,
          ),
        })),
      }),
    );
  };

  const addCustomSection = () => {
    const existingCount = resume.sections.filter((section) => section.type === 'custom').length + 1;
    const customSection = createSection('custom', {
      title: `自定义模块 ${existingCount}`,
    });

    setResume((prev) =>
      touch({
        ...prev,
        sections: [...prev.sections, customSection],
      }),
    );

    return customSection.id;
  };

  const removeSection = (sectionId: string) => {
    setResume((prev) =>
      touch({
        ...prev,
        sections: prev.sections.filter((section) => section.id !== sectionId),
      }),
    );
  };

  const addPresetSection = (type: SectionType) => {
    const existingSection = resume.sections.find(
      (section) => section.type === type && !section.custom,
    );

    if (existingSection) {
      return existingSection.id;
    }

    const nextSection = createSection(type);

    setResume((prev) =>
      touch({
        ...prev,
        sections: [...prev.sections, nextSection],
      }),
    );

    return nextSection.id;
  };

  const updateAvatar = (file: File) =>
    new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        setResume((prev) =>
          touch({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              avatar: String(reader.result ?? ''),
            },
          }),
        );
        resolve();
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const removeAvatar = () => {
    updatePersonalInfo('avatar', '');
  };

  return {
    resume,
    enabledSectionCount,
    updatePersonalInfo,
    updateSetting,
    updateSectionTitle,
    toggleSection,
    moveSection,
    addSectionItem,
    removeSectionItem,
    updateSectionField,
    addCustomSection,
    removeSection,
    addPresetSection,
    updateAvatar,
    removeAvatar,
  };
};
