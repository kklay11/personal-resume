import { CONTENT_SIZE_OPTIONS, TITLE_SIZE_OPTIONS } from '../constants';
import { isTitleEditableSection } from '../lib/sectionContent';
import type { ResumeData, ResumeSection, SectionSchema, SectionType } from '../types';
import { NumberField } from './NumberField';

interface ConfigDrawerProps {
  resume: ResumeData;
  configTab: string;
  configTabs: Array<{ key: string; label: string }>;
  configSection: ResumeSection | undefined;
  builtInSectionTypes: SectionSchema[];
  onConfigTabChange: (tab: string) => void;
  onClose: () => void;
  onUpdateSetting: <K extends keyof ResumeData['settings']>(
    field: K,
    value: ResumeData['settings'][K],
  ) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onToggleSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onEditModule: (sectionId: string) => void;
  onEditBasic: () => void;
  onAddPreset: (type: SectionType) => void;
}

export const ConfigDrawer = ({
  resume,
  configTab,
  configTabs,
  configSection,
  builtInSectionTypes,
  onConfigTabChange,
  onClose,
  onUpdateSetting,
  onUpdateSectionTitle,
  onToggleSection,
  onMoveSection,
  onEditModule,
  onEditBasic,
  onAddPreset,
}: ConfigDrawerProps) => (
  <div className="config-overlay" onClick={onClose}>
    <div className="config-drawer config-drawer--wide" onClick={(event) => event.stopPropagation()}>
      <div className="config-drawer__header config-drawer__header--line">
        <h3>简历配置与模块管理</h3>
        <button type="button" className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="config-tab-strip">
        {configTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={configTab === tab.key ? 'config-tab active' : 'config-tab'}
            onClick={() => onConfigTabChange(tab.key)}
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
                  onUpdateSetting('template', event.target.value as ResumeData['settings']['template'])
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
                  onChange={(event) => onUpdateSetting('accentColor', event.target.value)}
                />
                <input
                  value={resume.settings.accentColor}
                  onChange={(event) => onUpdateSetting('accentColor', event.target.value)}
                />
              </div>
            </label>

            <label className="field">
              <span>模块标题大小</span>
              <select
                value={String(resume.settings.sectionTitleSize)}
                onChange={(event) => onUpdateSetting('sectionTitleSize', Number(event.target.value))}
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
                onChange={(event) => onUpdateSetting('contentFontSize', Number(event.target.value))}
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
              onChange={(value) => onUpdateSetting('sectionGap', value)}
              suffix="px"
            />

            <NumberField
              label="行高"
              value={resume.settings.lineHeight}
              min={1}
              max={2}
              step={0.05}
              onChange={(value) => onUpdateSetting('lineHeight', Number(value.toFixed(2)))}
            />

            <div className="field">
              <span>页边距</span>
              <div className="margin-grid">
                <NumberField
                  label="上页边距"
                  value={resume.settings.pageMarginTop}
                  min={16}
                  max={96}
                  onChange={(value) => onUpdateSetting('pageMarginTop', value)}
                  suffix="px"
                />
                <NumberField
                  label="下页边距"
                  value={resume.settings.pageMarginBottom}
                  min={16}
                  max={96}
                  onChange={(value) => onUpdateSetting('pageMarginBottom', value)}
                  suffix="px"
                />
                <NumberField
                  label="左页边距"
                  value={resume.settings.pageMarginLeft}
                  min={16}
                  max={96}
                  onChange={(value) => onUpdateSetting('pageMarginLeft', value)}
                  suffix="px"
                />
                <NumberField
                  label="右页边距"
                  value={resume.settings.pageMarginRight}
                  min={16}
                  max={96}
                  onChange={(value) => onUpdateSetting('pageMarginRight', value)}
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
                    onChange={() => onUpdateSetting('showProfileHeader', !resume.settings.showProfileHeader)}
                  />
                  <span>{resume.settings.showProfileHeader ? '显示' : '隐藏'}</span>
                </label>
                <button type="button" className="ghost-button" onClick={onEditBasic}>
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
                    onClick={() => onMoveSection(section.id, -1)}
                    disabled={index <= 0}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onMoveSection(section.id, 1)}
                    disabled={index === resume.sections.length - 1}
                  >
                    下移
                  </button>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => onToggleSection(section.id)}
                    />
                    <span>{section.enabled ? '显示' : '隐藏'}</span>
                  </label>
                  <button type="button" className="ghost-button" onClick={() => onEditModule(section.id)}>
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
                    <button type="button" className="primary-button" onClick={() => onAddPreset(schema.type)}>
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
                onChange={() => onUpdateSetting('showProfileHeader', !resume.settings.showProfileHeader)}
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
                onChange={() => onUpdateSetting('profileMetaNewLine', !resume.settings.profileMetaNewLine)}
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
                onChange={() => onUpdateSetting('contactMetaNewLine', !resume.settings.contactMetaNewLine)}
              />
            </label>

            <button type="button" className="primary-button" onClick={onEditBasic}>
              去编辑基本信息
            </button>
          </div>
        ) : null}

        {configSection ? (
          <div className="config-group">
            <div className="section-intro">
              <h2>{configSection.title}</h2>
              <p>调整当前模块显隐与排序。</p>
            </div>

            {isTitleEditableSection(configSection) ? (
              <label className="field">
                <span>模块标题</span>
                <input
                  value={configSection.title}
                  onChange={(event) => onUpdateSectionTitle(configSection.id, event.target.value)}
                />
              </label>
            ) : (
              <div className="field">
                <span>模块标题</span>
                <div className="readonly-field">{configSection.title}</div>
              </div>
            )}

            <label className="switch-card">
              <div>
                <strong>显示该模块</strong>
                <p>分页预览和导出 PDF 会同步使用当前状态。</p>
              </div>
              <input
                type="checkbox"
                checked={configSection.enabled}
                onChange={() => onToggleSection(configSection.id)}
              />
            </label>

            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => onMoveSection(configSection.id, -1)}>
                上移模块
              </button>
              <button type="button" className="ghost-button" onClick={() => onMoveSection(configSection.id, 1)}>
                下移模块
              </button>
              <button type="button" className="primary-button" onClick={() => onEditModule(configSection.id)}>
                去编辑模块
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="config-drawer__footer">
        <button type="button" className="primary-button" onClick={onClose}>
          完成配置
        </button>
      </div>
    </div>
  </div>
);
