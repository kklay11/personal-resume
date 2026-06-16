import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BASIC_TABS_LABEL, RESUME_PAGE_HEIGHT, RESUME_PAGE_WIDTH } from './constants';
import { exportResumePdf } from './lib/pdf';
import { paginateSections, prepareSectionForPagination } from './lib/pagination';
import type { PreviewPage } from './lib/pagination';
import {
  asText,
  getVisibleItems,
  isTitleEditableSection,
  sectionHasContent,
} from './lib/sectionContent';
import { clampNumber, waitForNextFrame } from './lib/utils';
import { getSectionSchema, SECTION_SCHEMAS } from './resumeConfig';
import { useResumeBuilder } from './hooks/useResumeBuilder';
import { AuthScreen } from './components/AuthScreen';
import { BasicInfoForm } from './components/BasicInfoForm';
import { ConfigDrawer } from './components/ConfigDrawer';
import { ResumeHeader } from './components/ResumeHeader';
import { ResumeItem } from './components/ResumeItem';
import { ResumeSectionBlock } from './components/ResumeSectionBlock';
import { SectionForm } from './components/SectionForm';
import type { SectionType } from './types';

type ActiveTab = 'basic' | string;
type ConfigTab = 'global' | 'modules' | 'basic' | string;

const getSyncStatusLabel = (syncState: 'local' | 'syncing' | 'synced' | 'error') => {
  if (syncState === 'syncing') {
    return '云端保存中...';
  }

  if (syncState === 'synced') {
    return '已同步到云端';
  }

  if (syncState === 'error') {
    return '云端同步失败';
  }

  return '本地模式';
};

const App = () => {
  const {
    resume,
    enabledSectionCount,
    resumeList,
    currentResumeId,
    currentUserEmail,
    authReady,
    cloudEnabled,
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
    addPresetSection,
    removeSection,
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
  } = useResumeBuilder();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [configOpen, setConfigOpen] = useState(false);
  const [configTab, setConfigTab] = useState<ConfigTab>('global');
  const [isExporting, setIsExporting] = useState(false);
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
  const [previewScale, setPreviewScale] = useState(1);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const measureHeaderRef = useRef<HTMLDivElement>(null);
  const measureSectionTitleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const measureSectionItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const appStyle = {
    '--accent-color': resume.settings.accentColor,
    '--resume-title-size': `${resume.settings.sectionTitleSize}px`,
    '--resume-content-size': `${resume.settings.contentFontSize}px`,
    '--resume-line-height': String(resume.settings.lineHeight),
    '--resume-avatar-ratio': String(resume.settings.avatarAspectRatio),
    '--resume-section-gap': `${resume.settings.sectionGap}px`,
    '--resume-margin-top': `${resume.settings.pageMarginTop}px`,
    '--resume-margin-bottom': `${resume.settings.pageMarginBottom}px`,
    '--resume-margin-left': `${resume.settings.pageMarginLeft}px`,
    '--resume-margin-right': `${resume.settings.pageMarginRight}px`,
  } as CSSProperties;

  useEffect(() => {
    if (activeTab === 'basic') {
      return;
    }

    const exists = resume.sections.some((section) => section.id === activeTab);

    if (!exists) {
      setActiveTab('basic');
    }
  }, [activeTab, resume.sections]);

  useEffect(() => {
    if (configTab === 'global' || configTab === 'modules' || configTab === 'basic') {
      return;
    }

    const exists = resume.sections.some((section) => section.id === configTab);

    if (!exists) {
      setConfigTab('global');
    }
  }, [configTab, resume.sections]);

  useLayoutEffect(() => {
    const viewport = previewViewportRef.current;

    if (!viewport) {
      return;
    }

    const updateScale = () => {
      const nextScale = clampNumber((viewport.clientWidth - 24) / RESUME_PAGE_WIDTH, 0.42, 1);
      setPreviewScale(Number(nextScale.toFixed(3)));
    };

    updateScale();

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const bindIndependentWheel = (element: HTMLDivElement | null) => {
      if (!element) {
        return () => undefined;
      }

      const handleWheel = (event: WheelEvent) => {
        if (isExporting) {
          return;
        }

        const { deltaY } = event;

        if (deltaY === 0) {
          return;
        }

        const maxScrollTop = element.scrollHeight - element.clientHeight;

        if (maxScrollTop <= 0) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        element.scrollTop = clampNumber(element.scrollTop + deltaY, 0, maxScrollTop);
      };

      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    };

    const cleanupEditor = bindIndependentWheel(editorScrollRef.current);
    const cleanupPreview = bindIndependentWheel(previewRef.current);

    return () => {
      cleanupEditor();
      cleanupPreview();
    };
  }, [isExporting]);

  const activeSection = useMemo(
    () => resume.sections.find((section) => section.id === activeTab),
    [activeTab, resume.sections],
  );
  const visibleSections = useMemo(
    () => resume.sections.filter((section) => section.enabled && sectionHasContent(section)),
    [resume.sections],
  );
  const preparedSections = useMemo(
    () => visibleSections.map(prepareSectionForPagination),
    [visibleSections],
  );
  const builtInSectionTypes = useMemo(
    () => Object.values(SECTION_SCHEMAS).filter((schema) => schema.type !== 'custom'),
    [],
  );

  const configTabs = useMemo(
    () => [
      { key: 'global' as const, label: '全局配置' },
      { key: 'modules' as const, label: '模块配置' },
      { key: 'basic' as const, label: '基本信息' },
      ...resume.sections.map((section) => ({ key: section.id, label: section.title })),
    ],
    [resume.sections],
  );

  const configSection = useMemo(
    () => resume.sections.find((section) => section.id === configTab),
    [configTab, resume.sections],
  );

  useLayoutEffect(() => {
    const pages = paginateSections({
      sections: preparedSections,
      resume,
      measuredHeaderHeight: measureHeaderRef.current ? measureHeaderRef.current.offsetHeight : null,
      getMeasuredTitleHeight: (sectionId) => measureSectionTitleRefs.current[sectionId]?.offsetHeight,
      getMeasuredItemHeight: (measureId) => measureSectionItemRefs.current[measureId]?.offsetHeight,
    });

    setPreviewPages(pages);
  }, [preparedSections, resume]);

  const handleExport = async () => {
    if (!previewRef.current) {
      return;
    }

    try {
      setIsExporting(true);
      await waitForNextFrame();
      await waitForNextFrame();
      await exportResumePdf(previewRef.current, resume.personalInfo.fullName || 'resume');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'PDF 导出失败，请稍后重试。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await updateAvatar(file);
    } catch {
      window.alert('头像上传失败，请重新选择图片。');
    }
  };

  const handleAuthSubmit = async () => {
    if (!authEmailInput.trim()) {
      window.alert('请输入邮箱地址。');
      return;
    }

    if (!authPasswordInput.trim()) {
      window.alert('请输入密码。');
      return;
    }

    try {
      if (authMode === 'sign-up') {
        await signUpWithPassword(authEmailInput.trim(), authPasswordInput);
        window.alert('注册成功，请直接使用该邮箱和密码登录。');
        setAuthMode('sign-in');
      } else {
        await signInWithPassword(authEmailInput.trim(), authPasswordInput);
      }

      setAuthPasswordInput('');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : authMode === 'sign-up' ? '注册失败。' : '登录失败。');
    }
  };

  const handleEditModule = (sectionId: string) => {
    setActiveTab(sectionId);
    setConfigOpen(false);
  };

  const handleEditBasic = () => {
    setActiveTab('basic');
    setConfigOpen(false);
  };

  const handleAddPreset = (type: SectionType) => {
    const sectionId = addPresetSection(type);
    setActiveTab(sectionId);
    setConfigTab(sectionId);
  };

  const isAuthScreenVisible = cloudEnabled && !currentUserEmail;

  if (isAuthScreenVisible) {
    return (
      <AuthScreen
        authReady={authReady}
        authMode={authMode}
        email={authEmailInput}
        password={authPasswordInput}
        isSubmitting={isAuthSubmitting}
        cloudEnabled={cloudEnabled}
        onEmailChange={setAuthEmailInput}
        onPasswordChange={setAuthPasswordInput}
        onModeToggle={() => setAuthMode((prev) => (prev === 'sign-in' ? 'sign-up' : 'sign-in'))}
        onSubmit={() => void handleAuthSubmit()}
      />
    );
  }

  return (
    <div className="app-shell" style={appStyle}>
      <aside className="editor-panel">
        <div className="panel-header">
          <div>
            <h1>简历编辑器</h1>
            <p>左侧模块化编辑，右侧实时分页预览与导出 PDF。</p>
            <div className="status-line">
              <span className={syncState === 'error' ? 'status-chip status-chip--error' : 'status-chip'}>
                {getSyncStatusLabel(syncState)}
              </span>
              {cloudEnabled ? <span className="status-chip">{currentUserEmail ? currentUserEmail : '未登录'}</span> : null}
            </div>
            {cloudError ? <div className="status-error">{cloudError}</div> : null}
          </div>
          <div className="header-actions">
            {cloudEnabled ? (
              <>
                <select
                  value={currentResumeId ?? ''}
                  onChange={(event) => void selectResume(event.target.value)}
                  className="toolbar-select"
                >
                  {resumeList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <button type="button" className="ghost-button" onClick={() => void createResumeRecord()}>
                  新建云端简历
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void deleteCurrentResume()}
                  disabled={!currentResumeId || resumeList.length <= 1}
                >
                  删除当前简历
                </button>
                <button type="button" className="ghost-button" onClick={() => void signOut()}>
                  退出登录
                </button>
              </>
            ) : (
              <span className="status-chip">未配置 Supabase，当前仅本地保存</span>
            )}
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                const sectionId = addCustomSection();
                setActiveTab(sectionId);
              }}
            >
              + 自定义简历模块
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setConfigTab('global');
                setConfigOpen(true);
              }}
            >
              简历配置与模块管理
            </button>
          </div>
        </div>

        <div className="tab-strip">
          <button
            type="button"
            className={activeTab === 'basic' ? 'tab-item active' : 'tab-item'}
            onClick={() => setActiveTab('basic')}
          >
            {BASIC_TABS_LABEL}
          </button>
          {resume.sections.map((section) => (
            <button
              type="button"
              key={section.id}
              className={activeTab === section.id ? 'tab-item active' : 'tab-item'}
              onClick={() => setActiveTab(section.id)}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div ref={editorScrollRef} className="panel-scroll">
          {pendingLocalDraftImport ? (
            <div className="cloud-import-banner">
              <div>
                <strong>检测到本地未上传草稿</strong>
                <p>登录后可以先把本地草稿导入云端，再继续编辑。</p>
              </div>
              <div className="action-row">
                <button type="button" className="primary-button" onClick={() => void importLocalDraftToCloud()}>
                  导入到云端
                </button>
                <button type="button" className="ghost-button" onClick={() => void dismissLocalDraftImport()}>
                  暂不导入
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'basic' ? (
            <BasicInfoForm
              resume={resume}
              onChange={updatePersonalInfo}
              onUploadAvatar={handleAvatarUpload}
              onRemoveAvatar={removeAvatar}
            />
          ) : activeSection ? (
            <SectionForm
              section={activeSection}
              schema={getSectionSchema(activeSection.type)}
              canRenameTitle={isTitleEditableSection(activeSection)}
              canMoveUp={resume.sections[0]?.id !== activeSection.id}
              canMoveDown={resume.sections[resume.sections.length - 1]?.id !== activeSection.id}
              onRename={(value) => updateSectionTitle(activeSection.id, value)}
              onToggle={() => toggleSection(activeSection.id)}
              onMove={(direction) => moveSection(activeSection.id, direction)}
              onAddItem={() => addSectionItem(activeSection.id)}
              onRemoveItem={(itemIndex) => removeSectionItem(activeSection.id, itemIndex)}
              onUpdateField={(itemIndex, fieldKey, value) =>
                updateSectionField(activeSection.id, itemIndex, fieldKey, value)
              }
              onRemoveSection={() => removeSection(activeSection.id)}
            />
          ) : null}
        </div>
      </aside>

      <main className="preview-panel">
        <div className="preview-toolbar">
          <div>
            <h2>简历预览</h2>
            <p>{enabledSectionCount} 个模块已启用，分页视图与导出 PDF 保持一致。</p>
          </div>
          <div className="preview-mode-badge">分页视图</div>
        </div>

        <div ref={previewViewportRef} className="preview-viewport">
          <div ref={previewRef} className={isExporting ? 'preview-pages exporting' : 'preview-pages'}>
            {previewPages.map((page, index) => (
              <div
                key={page.id}
                className="preview-page-shell"
                style={{
                  width: `${RESUME_PAGE_WIDTH * previewScale}px`,
                  minHeight: `${RESUME_PAGE_HEIGHT * previewScale}px`,
                }}
              >
                <div
                  className="preview-page-shell__inner"
                  style={{
                    width: `${RESUME_PAGE_WIDTH}px`,
                    minHeight: `${RESUME_PAGE_HEIGHT}px`,
                    transform: isExporting ? 'none' : `scale(${previewScale})`,
                  }}
                >
                  <div className="resume-paper">
                    {page.showHeader ? <ResumeHeader resume={resume} /> : null}
                    {page.sections.length > 0 ? (
                      page.sections.map((section) => (
                        <ResumeSectionBlock
                          key={`${page.id}-${section.id}`}
                          section={section}
                          accentColor={resume.settings.accentColor}
                        />
                      ))
                    ) : index === 0 ? (
                      <div className="empty-preview">
                        启用并填写左侧模块后，这里会实时生成可导出的简历内容。
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-actions">
          <button type="button" className="primary-button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? '导出中...' : '导出 PDF'}
          </button>
        </div>
      </main>

      {configOpen ? (
        <ConfigDrawer
          resume={resume}
          configTab={configTab}
          configTabs={configTabs}
          configSection={configSection}
          builtInSectionTypes={builtInSectionTypes}
          onConfigTabChange={setConfigTab}
          onClose={() => setConfigOpen(false)}
          onUpdateSetting={updateSetting}
          onUpdateSectionTitle={updateSectionTitle}
          onToggleSection={toggleSection}
          onMoveSection={moveSection}
          onEditModule={handleEditModule}
          onEditBasic={handleEditBasic}
          onAddPreset={handleAddPreset}
        />
      ) : null}

      <div className="resume-measure">
        <div className="resume-paper resume-paper--measure">
          {resume.settings.showProfileHeader ? (
            <div ref={measureHeaderRef}>
              <ResumeHeader resume={resume} />
            </div>
          ) : null}
          {preparedSections.map((section) => (
            <div key={section.id}>
              <div
                ref={(element) => {
                  measureSectionTitleRefs.current[section.id] = element;
                }}
                className="resume-section__title"
                style={{ borderColor: resume.settings.accentColor, color: resume.settings.accentColor }}
              >
                {section.title}
              </div>
              <div className="section-content">
                {getVisibleItems(section).map((item, index) => (
                  <div
                    key={asText(item.__measureId) || `${section.id}-${index}`}
                    ref={(element) => {
                      measureSectionItemRefs.current[asText(item.__measureId) || `${section.id}-${index}`] = element;
                    }}
                    className="measure-item"
                  >
                    <ResumeItem section={section} item={item} index={index} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
