import { useRef } from 'react';
import type { ResumeData } from '../types';
import { formatUpdatedAt, handleScrollableWheel } from '../lib/utils';

interface BasicInfoFormProps {
  resume: ResumeData;
  onChange: (field: keyof ResumeData['personalInfo'], value: string) => void;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
}

const BASIC_FIELDS: Array<{
  key: keyof ResumeData['personalInfo'];
  label: string;
  placeholder: string;
}> = [
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

export const BasicInfoForm = ({
  resume,
  onChange,
  onUploadAvatar,
  onRemoveAvatar,
}: BasicInfoFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        {BASIC_FIELDS.map((field) => (
          <label key={field.key} className={field.key === 'headline' ? 'field full-width' : 'field'}>
            <span>{field.label}</span>
            {field.key === 'headline' ? (
              <textarea
                value={resume.personalInfo[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
                onWheelCapture={handleScrollableWheel}
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
