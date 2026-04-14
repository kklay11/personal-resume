import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { exportResumePdf } from './lib/pdf';
import { getSectionSchema, SECTION_SCHEMAS } from './resumeConfig';
import { useResumeBuilder } from './hooks/useResumeBuilder';
import type { ResumeData, ResumeSection, SectionItem, SectionSchema, SectionValue } from './types';

type ActiveTab = 'basic' | string;
type ConfigTab = 'global' | 'modules' | 'basic' | string;

interface PreviewPage {
  id: string;
  showHeader: boolean;
  sections: ResumeSection[];
}

const BASIC_TABS_LABEL = '基本信息';
const TITLE_SIZE_OPTIONS = [15, 16, 18, 20, 22, 24];
const CONTENT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 18];
const RESUME_PAGE_BOTTOM_BUFFER = 16;
const RESUME_HEADER_GAP = 20;
const RESUME_TITLE_GAP = 12;
const RESUME_ITEM_GAP = 12;

const asText = (value: SectionValue | undefined) => (typeof value === 'string' ? value : '');

const asList = (value: SectionValue | undefined) =>
  Array.isArray(value) ? value.filter(Boolean) : typeof value === 'string' && value.trim() ? [value] : [];

const itemHasContent = (item: SectionItem) =>
  Object.values(item).some((value) =>
    Array.isArray(value) ? value.some((entry) => entry.trim()) : value.trim(),
  );

const getVisibleItems = (section: ResumeSection) => section.items.filter(itemHasContent);

const sectionHasContent = (section: ResumeSection) => section.items.some(itemHasContent);

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const estimateSectionWeight = (section: ResumeSection, resume: ResumeData) => {
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

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const joinMetaGroup = (values: string[]) => values.filter(Boolean).join(' ｜ ');
const getDescriptionLines = (item: SectionItem) => {
  const lines = asList(item.description);

  if (lines.length > 0) {
    return lines;
  }

  const singleDescription = asText(item.description);
  return singleDescription ? [singleDescription] : [];
};
const isCompactTextSection = (type: ResumeSection['type']) =>
  type === 'awards' || type === 'campus' || type === 'certificates';

const NumberField = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
}) => (
  <label className="field">
    <span>{label}</span>
    <div className="number-field">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
      />
      {suffix ? <em>{suffix}</em> : null}
    </div>
  </label>
);

const BasicInfoForm = ({
  resume,
  onChange,
  onUploadAvatar,
  onRemoveAvatar,
}: {
  resume: ResumeData;
  onChange: (field: keyof ResumeData['personalInfo'], value: string) => void;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basicFields: Array<{ key: keyof ResumeData['personalInfo']; label: string; placeholder: string }> = [
    { key: 'fullName', label: '姓名', placeholder: '请输入姓名' },
    { key: 'phone', label: '电话', placeholder: '请输入手机号' },
    { key: 'email', label: '邮箱', placeholder: '请输入邮箱地址' },
    { key: 'gender', label: '性别', placeholder: '请输入性别' },
    { key: 'age', label: '年龄', placeholder: '请输入年龄' },
    { key: 'city', label: '籍贯/城市', placeholder: '请输入所在城市' },
    { key: 'blog', label: '个人博客', placeholder: '例如：https://yourblog.com' },
    { key: 'targetRole', label: '求职方向', placeholder: '例如：算法工程师 / 前端开发' },
    { key: 'headline', label: '个人亮点', placeholder: '一句话概括你的优势' },
  ];

  return (
    <div className="panel-section">
      <div className="section-intro">
        <h2>基本信息</h2>
        <p>填写姓名、联系方式与头像，这些内容会出现在简历顶部区域。</p>
      </div>

      <div className="avatar-uploader">
        <div className="avatar-preview">
          {resume.personalInfo.avatar ? (
            <img src={resume.personalInfo.avatar} alt={resume.personalInfo.fullName || '头像'} />
          ) : (
            <span>{resume.personalInfo.fullName.slice(0, 1) || '照'}</span>
          )}
        </div>
        <p>支持 JPG、PNG、JPEG 格式，建议使用 1 MB 以内的证件照。</p>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={() => fileInputRef.current?.click()}>
            上传头像
          </button>
          <button type="button" className="ghost-button" onClick={onRemoveAvatar}>
            移除头像
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden-input"
          accept="image/png,image/jpeg"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            if (file.size > 1024 * 1024) {
              event.currentTarget.value = '';
              window.alert('请上传 1MB 以内的图片。');
              return;
            }

            onUploadAvatar(file);
            event.currentTarget.value = '';
          }}
        />
      </div>

      <div className="form-grid">
        {basicFields.map((field) => (
          <label key={field.key} className={field.key === 'headline' ? 'field full-width' : 'field'}>
            <span>{field.label}</span>
            {field.key === 'headline' ? (
              <textarea
                value={resume.personalInfo[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            ) : (
              <input
                value={resume.personalInfo[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>

      <div className="save-status">已自动保存：{formatUpdatedAt(resume.updatedAt)}</div>
    </div>
  );
};

const SectionForm = ({
  section,
  schema,
  canMoveUp,
  canMoveDown,
  onRename,
  onToggle,
  onMove,
  onAddItem,
  onRemoveItem,
  onUpdateField,
  onRemoveSection,
}: {
  section: ResumeSection;
  schema: SectionSchema;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (value: string) => void;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateField: (itemIndex: number, fieldKey: string, value: SectionValue) => void;
  onRemoveSection: () => void;
}) => (
  <div className="panel-section">
    <div className="section-intro">
      <h2>{schema.title}</h2>
      <p>{schema.description}</p>
    </div>

    <div className="module-toolbar">
      <label className="field grow">
        <span>模块标题</span>
        <input value={section.title} onChange={(event) => onRename(event.target.value)} />
      </label>
      <button type="button" className={section.enabled ? 'success-button' : 'ghost-button'} onClick={onToggle}>
        {section.enabled ? '已启用' : '已停用'}
      </button>
      <button type="button" className="ghost-button" onClick={() => onMove(-1)} disabled={!canMoveUp}>
        上移
      </button>
      <button type="button" className="ghost-button" onClick={() => onMove(1)} disabled={!canMoveDown}>
        下移
      </button>
      {section.custom ? (
        <button type="button" className="danger-button" onClick={onRemoveSection}>
          删除模块
        </button>
      ) : null}
    </div>

    <div className="item-stack">
      {section.items.map((item, itemIndex) => (
        <div key={`${section.id}-${itemIndex}`} className="item-card">
          <div className="item-card__header">
            <strong>
              {schema.singularLabel} {itemIndex + 1}
            </strong>
            {schema.repeatable ? (
              <button type="button" className="text-button" onClick={() => onRemoveItem(itemIndex)}>
                删除
              </button>
            ) : null}
          </div>

          <div className="form-grid">
            {schema.fields.map((field) => {
              const value = item[field.key];
              const isWide = field.type !== 'text';

              return (
                <label key={field.key} className={isWide ? 'field full-width' : 'field'}>
                  <span>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={asText(value)}
                      placeholder={field.placeholder}
                      onChange={(event) => onUpdateField(itemIndex, field.key, event.target.value)}
                    />
                  ) : field.type === 'list' ? (
                    <textarea
                      value={asList(value).join('\n')}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        onUpdateField(
                          itemIndex,
                          field.key,
                          event.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  ) : (
                    <input
                      value={asText(value)}
                      placeholder={field.placeholder}
                      onChange={(event) => onUpdateField(itemIndex, field.key, event.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>

    {schema.repeatable ? (
      <button type="button" className="primary-button" onClick={onAddItem}>
        新增{schema.singularLabel}
      </button>
    ) : null}
  </div>
);

const ResumeHeader = ({ resume }: { resume: ResumeData }) => {
  const profileMeta = joinMetaGroup([
    resume.personalInfo.gender,
    resume.personalInfo.age ? `${resume.personalInfo.age} 岁` : '',
    resume.personalInfo.city,
  ]);
  const contactMeta = joinMetaGroup([
    resume.personalInfo.phone,
    resume.personalInfo.email,
    resume.personalInfo.blog,
  ]);

  return (
    <header className="resume-header">
      <div className="resume-header__identity">
        <h1>{resume.personalInfo.fullName || '未命名'}</h1>
        {profileMeta || contactMeta ? (
          <div className="resume-meta-cluster">
            {profileMeta ? (
              <div className={resume.settings.profileMetaNewLine ? 'resume-meta' : 'resume-meta resume-meta--inline'}>
                {profileMeta}
              </div>
            ) : null}
            {contactMeta ? (
              <div className={resume.settings.contactMetaNewLine ? 'resume-meta' : 'resume-meta resume-meta--inline'}>
                {contactMeta}
              </div>
            ) : null}
          </div>
        ) : null}
        {resume.personalInfo.targetRole ? <div className="resume-headline">{resume.personalInfo.targetRole}</div> : null}
        {resume.personalInfo.headline ? <p className="resume-summary">{resume.personalInfo.headline}</p> : null}
      </div>
      <div className="resume-header__avatar">
        {resume.personalInfo.avatar ? (
          <img src={resume.personalInfo.avatar} alt={resume.personalInfo.fullName || '头像'} />
        ) : (
          <div className="avatar-fallback">{resume.personalInfo.fullName.slice(0, 1) || '简'}</div>
        )}
      </div>
    </header>
  );
};

const GenericExperience = ({ section }: { section: ResumeSection }) => (
  <div className="section-content">
    {getVisibleItems(section).map((item, index) => {
      const title = asText(item.name) || asText(item.company);
      const subtitle = asText(item.role) || asText(item.subtitle) || asText(item.issuer);
      const lines = getDescriptionLines(item);
      const compactText = lines.join('；');

      if (isCompactTextSection(section.type)) {
        return (
          <article key={`${section.id}-${index}`} className="compact-entry">
            <div className="compact-entry__main">
              <strong>{[title, subtitle].filter(Boolean).join(' ｜ ') || section.title}</strong>
              {compactText ? <span>{compactText}</span> : null}
            </div>
            {asText(item.dateRange) ? <span className="compact-entry__date">{asText(item.dateRange)}</span> : null}
          </article>
        );
      }

      return (
        <article key={`${section.id}-${index}`} className="timeline-card">
          <div className="timeline-card__headline">
            <strong>{title || section.title}</strong>
            <span>{asText(item.dateRange)}</span>
          </div>
          {subtitle ? <div className="timeline-card__subline">{subtitle}</div> : null}
          {lines.map((line, lineIndex) => (
            <p key={`${section.id}-${index}-${lineIndex}`}>{line}</p>
          ))}
        </article>
      );
    })}
  </div>
);

const EducationSection = ({ section }: { section: ResumeSection }) => (
  <div className="section-content">
    {getVisibleItems(section).map((item, index) => (
      <article key={`${section.id}-${index}`} className="education-row">
        <div>
          <strong>
            {[asText(item.school), asText(item.major), asText(item.degree)].filter(Boolean).join('  ')}
          </strong>
          {asText(item.description) ? <p>{asText(item.description)}</p> : null}
        </div>
        <span>{asText(item.dateRange)}</span>
      </article>
    ))}
  </div>
);

const SkillsSection = ({ section }: { section: ResumeSection }) => (
  <div className="section-content">
    {getVisibleItems(section).map((item, index) => (
      <div key={`${section.id}-${index}`} className="skill-row">
        <strong>{asText(item.category)}：</strong>
        <span>{asList(item.items).join('、')}</span>
      </div>
    ))}
  </div>
);

const SummarySection = ({ section }: { section: ResumeSection }) => (
  <div className="section-content">
    {getVisibleItems(section).map((item, index) => (
      <p key={`${section.id}-${index}`} className="paragraph-block">
        {asText(item.content)}
      </p>
    ))}
  </div>
);

const SectionItemView = ({
  section,
  item,
  index,
}: {
  section: ResumeSection;
  item: SectionItem;
  index: number;
}) => {
  if (section.type === 'education') {
    return (
      <article className="education-row">
        <div>
          <strong>
            {[asText(item.school), asText(item.major), asText(item.degree)].filter(Boolean).join('  ')}
          </strong>
          {asText(item.description) ? <p>{asText(item.description)}</p> : null}
        </div>
        <span>{asText(item.dateRange)}</span>
      </article>
    );
  }

  if (section.type === 'skills') {
    return (
      <div className="skill-row">
        <strong>{asText(item.category)}：</strong>
        <span>{asList(item.items).join('、')}</span>
      </div>
    );
  }

  if (section.type === 'summary') {
    return <p className="paragraph-block">{asText(item.content)}</p>;
  }

  const title = asText(item.name) || asText(item.company);
  const subtitle = asText(item.role) || asText(item.subtitle) || asText(item.issuer);
  const lines = getDescriptionLines(item);
  const compactText = lines.join('；');

  if (isCompactTextSection(section.type)) {
    return (
      <article className="compact-entry" data-index={index}>
        <div className="compact-entry__main">
          <strong>{[title, subtitle].filter(Boolean).join(' ｜ ') || section.title}</strong>
          {compactText ? <span>{compactText}</span> : null}
        </div>
        {asText(item.dateRange) ? <span className="compact-entry__date">{asText(item.dateRange)}</span> : null}
      </article>
    );
  }

  return (
    <article className="timeline-card" data-index={index}>
      <div className="timeline-card__headline">
        <strong>{title || section.title}</strong>
        <span>{asText(item.dateRange)}</span>
      </div>
      {subtitle ? <div className="timeline-card__subline">{subtitle}</div> : null}
      {lines.map((line, lineIndex) => (
        <p key={`${section.id}-${index}-${lineIndex}`}>{line}</p>
      ))}
    </article>
  );
};

const ResumeSectionBlock = ({ section, accentColor }: { section: ResumeSection; accentColor: string }) => (
  <section className="resume-section">
    <div className="resume-section__title" style={{ borderColor: accentColor, color: accentColor }}>
      {section.title}
    </div>
    {section.type === 'education' ? <EducationSection section={section} /> : null}
    {section.type === 'skills' ? <SkillsSection section={section} /> : null}
    {section.type === 'summary' ? <SummarySection section={section} /> : null}
    {section.type !== 'education' && section.type !== 'skills' && section.type !== 'summary' ? (
      <GenericExperience section={section} />
    ) : null}
  </section>
);

const App = () => {
  const {
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
    addPresetSection,
    removeSection,
    updateAvatar,
    removeAvatar,
  } = useResumeBuilder();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [configOpen, setConfigOpen] = useState(false);
  const [configTab, setConfigTab] = useState<ConfigTab>('global');
  const [isExporting, setIsExporting] = useState(false);
  const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const measureHeaderRef = useRef<HTMLDivElement>(null);
  const measureSectionTitleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const measureSectionItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const appStyle = {
    '--accent-color': resume.settings.accentColor,
    '--resume-title-size': `${resume.settings.sectionTitleSize}px`,
    '--resume-content-size': `${resume.settings.contentFontSize}px`,
    '--resume-line-height': String(resume.settings.lineHeight),
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

  const activeSection = useMemo(
    () => resume.sections.find((section) => section.id === activeTab),
    [activeTab, resume.sections],
  );
  const visibleSections = useMemo(
    () => resume.sections.filter((section) => section.enabled && sectionHasContent(section)),
    [resume.sections],
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
    const pageCapacity =
      1123 - resume.settings.pageMarginTop - resume.settings.pageMarginBottom - RESUME_PAGE_BOTTOM_BUFFER;
    const headerHeight =
      resume.settings.showProfileHeader && measureHeaderRef.current
        ? measureHeaderRef.current.offsetHeight + RESUME_HEADER_GAP
        : 0;

    const pages: PreviewPage[] = [];
    let currentSections: ResumeSection[] = [];
    let currentHeight = 0;
    let currentCapacity = Math.max(420, pageCapacity - headerHeight);

    visibleSections.forEach((section) => {
      const items = getVisibleItems(section);
      const titleHeight =
        (measureSectionTitleRefs.current[section.id]?.offsetHeight ?? resume.settings.sectionTitleSize + 18) +
        RESUME_TITLE_GAP;

      if (items.length === 0) {
        return;
      }

      let itemIndex = 0;
      let fragmentIndex = 0;

      while (itemIndex < items.length) {
        const nextItemHeight =
          measureSectionItemRefs.current[`${section.id}-${itemIndex}`]?.offsetHeight ??
          estimateSectionWeight({ ...section, items: [items[itemIndex]] }, resume);

        if (
          currentSections.length > 0 &&
          currentHeight + titleHeight + nextItemHeight + resume.settings.sectionGap > currentCapacity
        ) {
          pages.push({
            id: `page-${pages.length + 1}`,
            showHeader: pages.length === 0 && resume.settings.showProfileHeader,
            sections: currentSections,
          });
          currentSections = [];
          currentHeight = 0;
          currentCapacity = Math.max(420, pageCapacity);
        }

        const fragmentItems: SectionItem[] = [];
        let fragmentHeight = titleHeight;

        while (itemIndex < items.length) {
          const itemHeight =
            measureSectionItemRefs.current[`${section.id}-${itemIndex}`]?.offsetHeight ??
            estimateSectionWeight({ ...section, items: [items[itemIndex]] }, resume);
          const blockHeight =
            fragmentHeight +
            itemHeight +
            (fragmentItems.length > 0 ? RESUME_ITEM_GAP : 0) +
            resume.settings.sectionGap;

          if (
            fragmentItems.length > 0 &&
            currentHeight + blockHeight > currentCapacity
          ) {
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
          pages.push({
            id: `page-${pages.length + 1}`,
            showHeader: pages.length === 0 && resume.settings.showProfileHeader,
            sections: currentSections,
          });
          currentSections = [];
          currentHeight = 0;
          currentCapacity = Math.max(420, pageCapacity);
        }
      }
    });

    if (currentSections.length > 0 || pages.length === 0) {
      pages.push({
        id: `page-${pages.length + 1}`,
        showHeader: pages.length === 0 && resume.settings.showProfileHeader,
        sections: currentSections,
      });
    }

    setPreviewPages(pages);
  }, [resume, visibleSections]);

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

  const updateNumericSetting = (
    field:
      | 'sectionTitleSize'
      | 'contentFontSize'
      | 'sectionGap'
      | 'lineHeight'
      | 'pageMarginTop'
      | 'pageMarginBottom'
      | 'pageMarginLeft'
      | 'pageMarginRight',
    value: number,
  ) => {
    updateSetting(field, value);
  };

  return (
    <div className="app-shell" style={appStyle}>
      <aside className="editor-panel">
        <div className="panel-header">
          <div>
            <h1>简历编辑器</h1>
            <p>左侧模块化编辑，右侧实时分页预览与导出 PDF。</p>
          </div>
          <div className="header-actions">
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

        <div className="panel-scroll">
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

        <div ref={previewRef} className={isExporting ? 'preview-pages exporting' : 'preview-pages'}>
          {previewPages.map((page, index) => (
            <div key={page.id} className="resume-paper">
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
          ))}
        </div>

        <div className="preview-actions">
          <button type="button" className="primary-button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? '导出中...' : '导出 PDF'}
          </button>
        </div>
      </main>

      {configOpen ? (
        <div className="config-overlay" onClick={() => setConfigOpen(false)}>
          <div className="config-drawer config-drawer--wide" onClick={(event) => event.stopPropagation()}>
            <div className="config-drawer__header config-drawer__header--line">
              <h3>简历配置与模块管理</h3>
              <button type="button" className="icon-button" onClick={() => setConfigOpen(false)}>
                x
              </button>
            </div>

            <div className="config-tab-strip">
              {configTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={configTab === tab.key ? 'config-tab active' : 'config-tab'}
                  onClick={() => setConfigTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="config-panel-body">
              {configTab === 'global' ? (
                <div className="config-group">
                  <label className="field">
                    <span>选择简历模板</span>
                    <select
                      value={resume.settings.template}
                      onChange={(event) =>
                        updateSetting('template', event.target.value as ResumeData['settings']['template'])
                      }
                    >
                      <option value="modern">现代</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>主题色</span>
                    <div className="color-input">
                      <input
                        type="color"
                        value={resume.settings.accentColor}
                        onChange={(event) => updateSetting('accentColor', event.target.value)}
                      />
                      <input
                        value={resume.settings.accentColor}
                        onChange={(event) => updateSetting('accentColor', event.target.value)}
                      />
                    </div>
                  </label>

                  <label className="field">
                    <span>模块标题大小</span>
                    <select
                      value={String(resume.settings.sectionTitleSize)}
                      onChange={(event) => updateNumericSetting('sectionTitleSize', Number(event.target.value))}
                    >
                      {TITLE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}px
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>模块内容大小</span>
                    <select
                      value={String(resume.settings.contentFontSize)}
                      onChange={(event) => updateNumericSetting('contentFontSize', Number(event.target.value))}
                    >
                      {CONTENT_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}px
                        </option>
                      ))}
                    </select>
                  </label>

                  <NumberField
                    label="模块间距"
                    value={resume.settings.sectionGap}
                    min={0}
                    max={48}
                    onChange={(value) => updateNumericSetting('sectionGap', value)}
                    suffix="px"
                  />

                  <NumberField
                    label="行高"
                    value={resume.settings.lineHeight}
                    min={1}
                    max={2}
                    step={0.05}
                    onChange={(value) =>
                      updateNumericSetting('lineHeight', Number(value.toFixed(2)))
                    }
                  />

                  <div className="field">
                    <span>页边距</span>
                    <div className="margin-grid">
                      <NumberField
                        label="上页边距"
                        value={resume.settings.pageMarginTop}
                        min={16}
                        max={96}
                        onChange={(value) => updateNumericSetting('pageMarginTop', value)}
                        suffix="px"
                      />
                      <NumberField
                        label="下页边距"
                        value={resume.settings.pageMarginBottom}
                        min={16}
                        max={96}
                        onChange={(value) => updateNumericSetting('pageMarginBottom', value)}
                        suffix="px"
                      />
                      <NumberField
                        label="左页边距"
                        value={resume.settings.pageMarginLeft}
                        min={16}
                        max={96}
                        onChange={(value) => updateNumericSetting('pageMarginLeft', value)}
                        suffix="px"
                      />
                      <NumberField
                        label="右页边距"
                        value={resume.settings.pageMarginRight}
                        min={16}
                        max={96}
                        onChange={(value) => updateNumericSetting('pageMarginRight', value)}
                        suffix="px"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {configTab === 'modules' ? (
                <div className="module-config-list">
                  <div className="module-list-header">模块配置</div>

                  <div className="module-config-item">
                    <div className="module-config-item__main">
                      <span className="module-handle">|||</span>
                      <strong>基本信息</strong>
                    </div>
                    <div className="module-config-item__actions">
                      <label className="switch-label">
                        <input
                          type="checkbox"
                          checked={resume.settings.showProfileHeader}
                          onChange={() => updateSetting('showProfileHeader', !resume.settings.showProfileHeader)}
                        />
                        <span>{resume.settings.showProfileHeader ? '显示' : '隐藏'}</span>
                      </label>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setActiveTab('basic');
                          setConfigOpen(false);
                        }}
                      >
                        编辑
                      </button>
                    </div>
                  </div>

                  {resume.sections.map((section, index) => (
                    <div key={section.id} className="module-config-item">
                      <div className="module-config-item__main">
                        <span className="module-handle">|||</span>
                        <strong>{section.title}</strong>
                      </div>
                      <div className="module-config-item__actions">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => moveSection(section.id, -1)}
                          disabled={index <= 0}
                        >
                          上移
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => moveSection(section.id, 1)}
                          disabled={index === resume.sections.length - 1}
                        >
                          下移
                        </button>
                        <label className="switch-label">
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={() => toggleSection(section.id)}
                          />
                          <span>{section.enabled ? '显示' : '隐藏'}</span>
                        </label>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => {
                            setActiveTab(section.id);
                            setConfigOpen(false);
                          }}
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))}

                  {builtInSectionTypes
                    .filter((schema) => !resume.sections.some((section) => section.type === schema.type && !section.custom))
                    .map((schema) => (
                      <div key={schema.type} className="module-config-item module-config-item--missing">
                        <div className="module-config-item__main">
                          <span className="module-handle">+++</span>
                          <strong>{schema.title}</strong>
                        </div>
                        <div className="module-config-item__actions">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                              const sectionId = addPresetSection(schema.type);
                              setActiveTab(sectionId);
                              setConfigTab(sectionId);
                            }}
                          >
                            添加模块
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : null}

              {configTab === 'basic' ? (
                <div className="config-group">
                  <div className="section-intro">
                    <h2>基本信息配置</h2>
                    <p>控制简历头部展示和基本信息分组换行方式。</p>
                  </div>

                  <label className="switch-card">
                    <div>
                      <strong>显示基本信息头部</strong>
                      <p>关闭后，预览与 PDF 都会移除姓名、联系方式和头像头部。</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={resume.settings.showProfileHeader}
                      onChange={() => updateSetting('showProfileHeader', !resume.settings.showProfileHeader)}
                    />
                  </label>

                  <label className="switch-card">
                    <div>
                      <strong>性别 / 年龄 / 城市单独一行</strong>
                      <p>关闭后会与电话、邮箱、博客信息尽量并排显示，压缩头部高度。</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={resume.settings.profileMetaNewLine}
                      onChange={() => updateSetting('profileMetaNewLine', !resume.settings.profileMetaNewLine)}
                    />
                  </label>

                  <label className="switch-card">
                    <div>
                      <strong>电话 / 邮箱 / 博客单独一行</strong>
                      <p>关闭后联系方式会和其他基本信息分组并排排列。</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={resume.settings.contactMetaNewLine}
                      onChange={() => updateSetting('contactMetaNewLine', !resume.settings.contactMetaNewLine)}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setActiveTab('basic');
                      setConfigOpen(false);
                    }}
                  >
                    去编辑基本信息
                  </button>
                </div>
              ) : null}

              {configSection ? (
                <div className="config-group">
                  <div className="section-intro">
                    <h2>{configSection.title}</h2>
                    <p>调整当前模块标题、显隐与排序。</p>
                  </div>

                  <label className="field">
                    <span>模块标题</span>
                    <input
                      value={configSection.title}
                      onChange={(event) => updateSectionTitle(configSection.id, event.target.value)}
                    />
                  </label>

                  <label className="switch-card">
                    <div>
                      <strong>显示该模块</strong>
                      <p>分页预览和导出 PDF 会同步使用当前状态。</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configSection.enabled}
                      onChange={() => toggleSection(configSection.id)}
                    />
                  </label>

                  <div className="action-row">
                    <button type="button" className="ghost-button" onClick={() => moveSection(configSection.id, -1)}>
                      上移模块
                    </button>
                    <button type="button" className="ghost-button" onClick={() => moveSection(configSection.id, 1)}>
                      下移模块
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setActiveTab(configSection.id);
                        setConfigOpen(false);
                      }}
                    >
                      去编辑模块
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="config-drawer__footer">
              <button type="button" className="primary-button" onClick={() => setConfigOpen(false)}>
                完成配置
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="resume-measure">
        <div className="resume-paper resume-paper--measure">
          {resume.settings.showProfileHeader ? (
            <div ref={measureHeaderRef}>
              <ResumeHeader resume={resume} />
            </div>
          ) : null}
          {visibleSections.map((section) => (
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
                    key={`${section.id}-${index}`}
                    ref={(element) => {
                      measureSectionItemRefs.current[`${section.id}-${index}`] = element;
                    }}
                    className="measure-item"
                  >
                    <SectionItemView section={section} item={item} index={index} />
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
