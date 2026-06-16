import type { ResumeSection, SectionSchema, SectionValue } from '../types';
import { asText } from '../lib/sectionContent';
import { normalizeMultilineValue } from '../lib/markdown';
import { handleScrollableWheel } from '../lib/utils';

interface SectionFormProps {
  section: ResumeSection;
  schema: SectionSchema;
  canRenameTitle: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (value: string) => void;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateField: (itemIndex: number, fieldKey: string, value: SectionValue) => void;
  onRemoveSection: () => void;
}

export const SectionForm = ({
  section,
  schema,
  canRenameTitle,
  canMoveUp,
  canMoveDown,
  onRename,
  onToggle,
  onMove,
  onAddItem,
  onRemoveItem,
  onUpdateField,
  onRemoveSection,
}: SectionFormProps) => (
  <div className="panel-section">
    <div className="section-intro">
      <h2>{schema.title}</h2>
      <p>{schema.description}</p>
    </div>

    <div className="module-toolbar">
      {canRenameTitle ? (
        <label className="field grow">
          <span>模块标题</span>
          <input value={section.title} onChange={(event) => onRename(event.target.value)} />
        </label>
      ) : (
        <div className="field grow">
          <span>模块标题</span>
          <div className="readonly-field">{section.title}</div>
        </div>
      )}
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
                    <>
                      <textarea
                        value={asText(value)}
                        placeholder={field.placeholder}
                        onChange={(event) => onUpdateField(itemIndex, field.key, event.target.value)}
                        onWheelCapture={handleScrollableWheel}
                      />
                      <small className="field-hint">支持 **加粗**、- 列表、空行分段。</small>
                    </>
                  ) : field.type === 'list' ? (
                    <textarea
                      value={normalizeMultilineValue(value)}
                      placeholder={field.placeholder}
                      onChange={(event) => onUpdateField(itemIndex, field.key, event.target.value)}
                      onWheelCapture={handleScrollableWheel}
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
