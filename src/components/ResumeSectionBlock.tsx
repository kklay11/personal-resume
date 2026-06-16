import type { ResumeSection } from '../types';
import { getVisibleItems } from '../lib/sectionContent';
import { ResumeItem } from './ResumeItem';

interface ResumeSectionBlockProps {
  section: ResumeSection;
  accentColor: string;
}

export const ResumeSectionBlock = ({ section, accentColor }: ResumeSectionBlockProps) => (
  <section className="resume-section">
    <div className="resume-section__title" style={{ borderColor: accentColor, color: accentColor }}>
      {section.title}
    </div>
    <div className="section-content">
      {getVisibleItems(section).map((item, index) => (
        <ResumeItem key={`${section.id}-${index}`} section={section} item={item} index={index} />
      ))}
    </div>
  </section>
);
