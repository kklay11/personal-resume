export type SectionType =
  | 'education'
  | 'projects'
  | 'skills'
  | 'awards'
  | 'campus'
  | 'internships'
  | 'work'
  | 'certificates'
  | 'summary'
  | 'custom';

export type FieldType = 'text' | 'textarea' | 'list';

export type SectionValue = string | string[];

export type SectionItem = Record<string, SectionValue>;

export interface SectionFieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
}

export interface SectionSchema {
  type: SectionType;
  title: string;
  description: string;
  singularLabel: string;
  repeatable: boolean;
  fields: SectionFieldSchema[];
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  custom?: boolean;
  items: SectionItem[];
}

export interface PersonalInfo {
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  age: string;
  city: string;
  blog: string;
  headline: string;
  targetRole: string;
  avatar: string;
}

export interface ResumeSettings {
  template: 'modern';
  accentColor: string;
  previewMode: 'paged' | 'compact';
  showProfileHeader: boolean;
  avatarAspectRatio: number;
  profileMetaNewLine: boolean;
  contactMetaNewLine: boolean;
  sectionTitleSize: number;
  contentFontSize: number;
  sectionGap: number;
  lineHeight: number;
  pageMarginTop: number;
  pageMarginBottom: number;
  pageMarginLeft: number;
  pageMarginRight: number;
}

export interface ResumeData {
  schemaVersion: number;
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
  settings: ResumeSettings;
  updatedAt: string;
}

export interface ResumeSummary {
  id: string;
  title: string;
  updatedAt: string;
}
