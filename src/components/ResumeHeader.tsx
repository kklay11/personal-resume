import type { ResumeData } from '../types';
import { joinMetaGroup } from '../lib/utils';

export const ResumeHeader = ({ resume }: { resume: ResumeData }) => {
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
