import type {
  PersonalInfo,
  ResumeData,
  ResumeSection,
  SectionItem,
  SectionSchema,
  SectionType,
} from './types';

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const SECTION_SCHEMAS: Record<SectionType, SectionSchema> = {
  education: {
    type: 'education',
    title: '教育背景',
    description: '填写学校、专业、学历与时间段。',
    singularLabel: '教育经历',
    repeatable: true,
    fields: [
      { key: 'school', label: '学校', type: 'text', placeholder: '例如：长春理工大学' },
      { key: 'major', label: '专业', type: 'text', placeholder: '例如：软件工程' },
      { key: 'degree', label: '学历', type: 'text', placeholder: '例如：硕士' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2023.09 - 2026.07' },
      { key: 'description', label: '补充描述', type: 'textarea', placeholder: '支持 **加粗**、- 列表、空行分段' },
    ],
  },
  projects: {
    type: 'projects',
    title: '项目经历',
    description: '展示项目成果、职责与关键技术。',
    singularLabel: '项目',
    repeatable: true,
    fields: [
      { key: 'name', label: '项目名称', type: 'text', placeholder: '例如：本地知识库与网络查询 RAG 检索器' },
      { key: 'role', label: '担任角色', type: 'text', placeholder: '例如：项目负责人 / 全栈开发' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2025.10 - 2025.11' },
      {
        key: 'description',
        label: '项目亮点',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
  skills: {
    type: 'skills',
    title: '专业技能',
    description: '使用单个编辑区维护技能内容，支持简单 Markdown。',
    singularLabel: '技能内容',
    repeatable: false,
    fields: [
      {
        key: 'content',
        label: '技能内容',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
  awards: {
    type: 'awards',
    title: '获奖经历',
    description: '突出奖项名称、时间和含金量。',
    singularLabel: '奖项',
    repeatable: true,
    fields: [
      { key: 'name', label: '奖项名称', type: 'text', placeholder: '例如：MICCAI 2025 竞赛入围' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2025.09' },
      { key: 'description', label: '奖项描述', type: 'textarea', placeholder: '支持 **加粗**、- 列表、空行分段' },
    ],
  },
  campus: {
    type: 'campus',
    title: '校园经历',
    description: '适合社团、学生组织、志愿服务等内容。',
    singularLabel: '校园经历',
    repeatable: true,
    fields: [
      { key: 'name', label: '组织/活动', type: 'text', placeholder: '例如：研究生会 / ACM 实验室' },
      { key: 'role', label: '角色', type: 'text', placeholder: '例如：部长 / 成员' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2022.09 - 2024.06' },
      {
        key: 'description',
        label: '经历描述',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
  internships: {
    type: 'internships',
    title: '实习经历',
    description: '记录实习公司、岗位与工作成果。',
    singularLabel: '实习经历',
    repeatable: true,
    fields: [
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如：某科技公司' },
      { key: 'role', label: '岗位名称', type: 'text', placeholder: '例如：前端开发实习生' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2024.05 - 2024.08' },
      {
        key: 'description',
        label: '工作内容',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
  work: {
    type: 'work',
    title: '工作经历',
    description: '适合全职工作、长期合作项目等内容。',
    singularLabel: '工作经历',
    repeatable: true,
    fields: [
      { key: 'company', label: '公司名称', type: 'text', placeholder: '例如：某智能科技有限公司' },
      { key: 'role', label: '岗位名称', type: 'text', placeholder: '例如：算法工程师' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2023.06 - 至今' },
      {
        key: 'description',
        label: '工作成果',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
  certificates: {
    type: 'certificates',
    title: '证书信息',
    description: '填写资格证书、认证考试、语言成绩等。',
    singularLabel: '证书',
    repeatable: true,
    fields: [
      { key: 'name', label: '证书名称', type: 'text', placeholder: '例如：英语六级 / PMP / 软考中级' },
      { key: 'issuer', label: '颁发机构', type: 'text', placeholder: '例如：教育部考试中心' },
      { key: 'dateRange', label: '获得时间', type: 'text', placeholder: '例如：2024.12' },
      { key: 'description', label: '证书说明', type: 'textarea', placeholder: '支持 **加粗**、- 列表、空行分段' },
    ],
  },
  summary: {
    type: 'summary',
    title: '个人评价',
    description: '用 2-4 句概括你的优势与求职方向。',
    singularLabel: '个人评价',
    repeatable: false,
    fields: [
      {
        key: 'content',
        label: '评价内容',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
  custom: {
    type: 'custom',
    title: '自定义模块',
    description: '用于扩展论文、竞赛、开源经历等自定义板块。',
    singularLabel: '自定义条目',
    repeatable: true,
    fields: [
      { key: 'name', label: '主标题', type: 'text', placeholder: '例如：论文发表 / 开源贡献' },
      { key: 'subtitle', label: '副标题', type: 'text', placeholder: '例如：作者 / 维护者 / 第一负责人' },
      { key: 'dateRange', label: '时间段', type: 'text', placeholder: '例如：2025.01 - 2025.12' },
      {
        key: 'description',
        label: '详细说明',
        type: 'textarea',
        placeholder: '支持 **加粗**、- 列表、空行分段',
      },
    ],
  },
};

export const getSectionSchema = (type: SectionType) => SECTION_SCHEMAS[type];

export const createEmptyItem = (type: SectionType): SectionItem => {
  const schema = getSectionSchema(type);
  return schema.fields.reduce<SectionItem>((item, field) => {
    item[field.key] = field.type === 'list' ? [] : '';
    return item;
  }, {});
};

export const createSection = (
  type: SectionType,
  overrides: Partial<ResumeSection> = {},
): ResumeSection => ({
  id: overrides.id ?? `${type}-${createId()}`,
  type,
  title: overrides.title ?? getSectionSchema(type).title,
  enabled: overrides.enabled ?? true,
  custom: overrides.custom ?? type === 'custom',
  items:
    overrides.items && overrides.items.length > 0
      ? overrides.items
      : [createEmptyItem(type)],
});

const defaultPersonalInfo: PersonalInfo = {
  fullName: '林沐然',
  phone: '13800001234',
  email: 'linmuran@example.com',
  gender: '女',
  age: '26',
  city: '杭州市',
  blog: 'https://portfolio.example.com',
  headline: '具备良好的产品思维与执行能力，能够独立推进从需求梳理到交付上线的完整流程。',
  targetRole: '产品经理 / 前端开发',
  avatar: '',
};

export const createDefaultResume = (): ResumeData => ({
  personalInfo: defaultPersonalInfo,
  settings: {
    template: 'modern',
    accentColor: '#2563eb',
    previewMode: 'paged',
    showProfileHeader: true,
    avatarAspectRatio: 0.714,
    profileMetaNewLine: true,
    contactMetaNewLine: true,
    sectionTitleSize: 24,
    contentFontSize: 15,
    sectionGap: 18,
    lineHeight: 1.55,
    pageMarginTop: 40,
    pageMarginBottom: 40,
    pageMarginLeft: 44,
    pageMarginRight: 44,
  },
  sections: [
    createSection('education', {
      items: [
        {
          school: '星海大学',
          major: '信息管理与信息系统',
          degree: '硕士',
          dateRange: '2021.09 - 2024.06',
          description: '主修产品设计、数据分析与信息系统规划，参与多项校内项目实践。',
        },
        {
          school: '江城学院',
          major: '数字媒体技术',
          degree: '本科',
          dateRange: '2017.09 - 2021.06',
          description: '系统学习交互设计、前端开发与视觉传达相关课程。',
        },
      ],
    }),
    createSection('projects', {
      items: [
        {
          name: '校园活动报名平台',
          role: '产品负责人',
          dateRange: '2023.03 - 2023.08',
          description:
            '**项目简介**：负责需求调研、功能拆解和原型设计，输出完整 PRD 与交互稿。\n\n- 协同前后端完成报名、审核、提醒等核心流程设计与上线。\n- 推动首月注册用户突破 3000，显著提升活动报名效率。',
        },
        {
          name: '内容运营数据看板',
          role: '前端开发',
          dateRange: '2024.01 - 2024.04',
          description:
            '**核心工作**：基于 React 与 ECharts 实现多维数据展示、趋势分析与筛选联动。\n\n- 优化首屏加载与图表渲染性能，提升复杂数据场景下的交互体验。\n- 支持运营团队按周追踪核心指标，减少人工汇总时间。',
        },
      ],
    }),
    createSection('skills', {
      items: [
        {
          content:
            '**产品能力**\n- 需求分析\n- 原型设计\n- 用户调研\n- 流程梳理\n\n**前端技术**\n- React\n- TypeScript\n- Vite\n- ECharts\n\n**协作工具**\n- Figma\n- Axure\n- Jira\n- Notion',
        },
      ],
    }),
    createSection('awards', {
      items: [
        {
          name: '校级优秀毕业生',
          dateRange: '2021.06',
          description: '因项目实践与综合表现突出获得院校表彰。',
        },
      ],
    }),
    createSection('campus', {
      items: [
        {
          name: '创新创业协会',
          role: '活动策划负责人',
          dateRange: '2019.09 - 2020.12',
          description: '策划并执行多场校园活动，统筹报名、宣传与现场协作。',
        },
      ],
    }),
    createSection('internships', {
      enabled: false,
      items: [createEmptyItem('internships')],
    }),
    createSection('work', {
      enabled: false,
      items: [createEmptyItem('work')],
    }),
    createSection('certificates', {
      items: [
        {
          name: 'PMP 基础培训证书',
          issuer: '项目管理学习中心',
          dateRange: '2023.11',
          description: '完成项目管理基础课程学习，熟悉需求、进度与风险管理方法。',
        },
      ],
    }),
    createSection('summary', {
      items: [
        {
          content:
            '具备较强的跨团队协作能力与执行意识，能够围绕业务目标推进需求落地，并持续关注用户体验与交付质量。',
        },
      ],
    }),
  ],
  updatedAt: new Date().toISOString(),
});
