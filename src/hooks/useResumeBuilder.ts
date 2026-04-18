import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBlankResume, createDefaultResume, createEmptyItem, createSection, getSectionSchema } from '../resumeConfig';
import {
  createResume as createCloudResume,
  deleteResume as deleteCloudResume,
  getCurrentSession,
  getCurrentUser,
  getResume,
  listResumes,
  signInWithPassword as signInWithPasswordRequest,
  signOut as signOutRequest,
  signUpWithPassword as signUpWithPasswordRequest,
  updateResume as updateCloudResume,
} from '../lib/resumeStore';
import { CURRENT_RESUME_SCHEMA_VERSION, deriveResumeTitle, normalizeResumeData } from '../lib/resumeData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ResumeData, ResumeSection, ResumeSummary, SectionType, SectionValue } from '../types';

const STORAGE_KEY = 'resume-builder:state:v6';
const ACTIVE_RESUME_ID_KEY = 'resume-builder:active-resume-id:v1';
const SKIP_IMPORT_KEY_PREFIX = 'resume-builder:skip-import:';

type SyncState = 'local' | 'syncing' | 'synced' | 'error';

const loadLocalResume = (): ResumeData => {
  const baseResume = createDefaultResume();

  if (typeof window === 'undefined') {
    return baseResume;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return baseResume;
  }

  try {
    return normalizeResumeData(JSON.parse(raw));
  } catch {
    return baseResume;
  }
};

const resetToBlankResume = () => {
  const blankResume = createBlankResume();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blankResume));
    window.localStorage.removeItem(ACTIVE_RESUME_ID_KEY);
  }

  return blankResume;
};

const hasLocalDraft = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(STORAGE_KEY));
};

const touch = (resume: ResumeData): ResumeData => ({
  ...resume,
  schemaVersion: CURRENT_RESUME_SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
});

const updateSection = (
  sections: ResumeSection[],
  sectionId: string,
  updater: (section: ResumeSection) => ResumeSection,
) => sections.map((section) => (section.id === sectionId ? updater(section) : section));

export const useResumeBuilder = () => {
  const [resume, setResume] = useState<ResumeData>(() => loadLocalResume());
  const [resumeList, setResumeList] = useState<ResumeSummary[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [pendingLocalDraftImport, setPendingLocalDraftImport] = useState(false);
  const hydrateTokenRef = useRef(0);
  const logoutResetRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    if (!currentResumeId) {
      window.localStorage.removeItem(ACTIVE_RESUME_ID_KEY);
      return;
    }

    window.localStorage.setItem(ACTIVE_RESUME_ID_KEY, currentResumeId);
  }, [currentResumeId]);

  const refreshResumeList = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return [];
    }

    const summaries = await listResumes();
    setResumeList(summaries);
    return summaries;
  }, []);

  const loadCloudResume = useCallback(async (resumeId: string) => {
    const cloudResume = await getResume(resumeId);

    if (!cloudResume) {
      throw new Error('未找到云端简历记录。');
    }

    setResume(normalizeResumeData(cloudResume.content_json));
    setCurrentResumeId(cloudResume.id);
    return cloudResume;
  }, []);

  const createAndSelectResume = useCallback(
    async (initialData?: ResumeData) => {
      const nextResume = normalizeResumeData(initialData ?? createBlankResume());
      const summary = await createCloudResume(nextResume, deriveResumeTitle(nextResume));
      const nextList = await refreshResumeList();
      setResume(nextResume);
      setCurrentResumeId(summary.id);
      setResumeList(nextList);
      setSyncState('synced');
      return summary;
    },
    [refreshResumeList],
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthReady(true);
      setSyncState('local');
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      try {
        const [session, user] = await Promise.all([getCurrentSession(), getCurrentUser()]);

        if (!mounted) {
          return;
        }

        setCurrentUserEmail(user?.email ?? session?.user?.email ?? null);
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isSupabaseConfigured || !currentUserEmail) {
      setResumeList([]);
      setCurrentResumeId(null);
      setPendingLocalDraftImport(false);
      setSyncState('local');
      setCloudError(null);

      if (logoutResetRef.current) {
        logoutResetRef.current = false;
        setResume(resetToBlankResume());
      } else {
        setResume(loadLocalResume());
      }

      return;
    }

    const currentToken = ++hydrateTokenRef.current;

    const hydrate = async () => {
      try {
        setCloudError(null);
        const summaries = await refreshResumeList();

        if (hydrateTokenRef.current !== currentToken) {
          return;
        }

        const skipImportKey = `${SKIP_IMPORT_KEY_PREFIX}${currentUserEmail}`;
        const shouldSkipImport = window.localStorage.getItem(skipImportKey) === '1';

        if (summaries.length === 0 && hasLocalDraft() && !shouldSkipImport) {
          setPendingLocalDraftImport(true);
          setCurrentResumeId(null);
          setSyncState('local');
          setResume(loadLocalResume());
          return;
        }

        setPendingLocalDraftImport(false);

        if (summaries.length === 0) {
          await createAndSelectResume();
          return;
        }

        const preferredId = window.localStorage.getItem(ACTIVE_RESUME_ID_KEY);
        const targetResume = summaries.find((item) => item.id === preferredId) ?? summaries[0];

        if (!targetResume) {
          return;
        }

        await loadCloudResume(targetResume.id);
        setSyncState('synced');
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : '云端数据初始化失败。');
        setSyncState('error');
      }
    };

    void hydrate();
  }, [authReady, createAndSelectResume, currentUserEmail, loadCloudResume, refreshResumeList]);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserEmail || !currentResumeId || !authReady) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSyncState('syncing');
        setCloudError(null);
        await updateCloudResume(currentResumeId, touch(resume), deriveResumeTitle(resume), CURRENT_RESUME_SCHEMA_VERSION);
        setResumeList((prev) =>
          prev
            .map((item) =>
              item.id === currentResumeId
                ? { ...item, title: deriveResumeTitle(resume), updatedAt: new Date().toISOString() }
                : item,
            )
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
        );
        setSyncState('synced');
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : '云端保存失败。');
        setSyncState('error');
      }
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authReady, currentResumeId, currentUserEmail, resume]);

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
    const existingSection = resume.sections.find((section) => section.type === type && !section.custom);

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
        const image = new Image();
        image.onload = () => {
          const nextAspectRatio = image.width > 0 && image.height > 0 ? image.width / image.height : 0.714;

          setResume((prev) =>
            touch({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                avatar: String(reader.result ?? ''),
              },
              settings: {
                ...prev.settings,
                avatarAspectRatio: Math.min(1.2, Math.max(0.55, Number(nextAspectRatio.toFixed(3)))),
              },
            }),
          );
          resolve();
        };
        image.onerror = () => reject(new Error('无法读取图片尺寸'));
        image.src = String(reader.result ?? '');
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const removeAvatar = () => {
    updatePersonalInfo('avatar', '');
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase 未配置。');
    }

    setIsAuthSubmitting(true);
    try {
      await signInWithPasswordRequest(email, password);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase 未配置。');
    }

    setIsAuthSubmitting(true);
    try {
      await signUpWithPasswordRequest(email, password);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      return;
    }

    logoutResetRef.current = true;
    setResume(resetToBlankResume());
    setResumeList([]);
    setCurrentResumeId(null);
    setPendingLocalDraftImport(false);
    setCloudError(null);
    setSyncState('local');
    await signOutRequest();
  };

  const selectResume = async (resumeId: string) => {
    await loadCloudResume(resumeId);
  };

  const importLocalDraftToCloud = async () => {
    if (!currentUserEmail) {
      return;
    }

    setPendingLocalDraftImport(false);
    await createAndSelectResume(loadLocalResume());
  };

  const dismissLocalDraftImport = async () => {
    if (!currentUserEmail) {
      return;
    }

    window.localStorage.setItem(`${SKIP_IMPORT_KEY_PREFIX}${currentUserEmail}`, '1');
    setPendingLocalDraftImport(false);

    if (resumeList.length === 0) {
      await createAndSelectResume();
      return;
    }

    await loadCloudResume(resumeList[0].id);
  };

  const createResumeRecord = async () => {
    await createAndSelectResume();
  };

  const deleteCurrentResume = async () => {
    if (!currentResumeId) {
      return;
    }

    await deleteCloudResume(currentResumeId);
    const nextList = await refreshResumeList();

    if (nextList.length === 0) {
      await createAndSelectResume();
      return;
    }

    await loadCloudResume(nextList[0].id);
  };

  return {
    resume,
    enabledSectionCount,
    resumeList,
    currentResumeId,
    currentUserEmail,
    authReady,
    cloudEnabled: isSupabaseConfigured,
    isAuthSubmitting,
    syncState,
    cloudError,
    pendingLocalDraftImport,
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
    signInWithPassword,
    signUpWithPassword,
    signOut,
    selectResume,
    createResumeRecord,
    deleteCurrentResume,
    importLocalDraftToCloud,
    dismissLocalDraftImport,
  };
};
