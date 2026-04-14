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
      { key: 'description', label: '补充描述', type: 'textarea', placeholder: '课程亮点、研究方向、GPA 等' },
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
      { key: 'description', label: '项目亮点', type: 'list', placeholder: '每行一条，描述问题、方案、结果' },
    ],
  },
  skills: {
    type: 'skills',
    title: '专业技能',
    description: '按分类维护技能清单，右侧会自动格式化展示。',
    singularLabel: '技能分类',
    repeatable: true,
    fields: [
      { key: 'category', label: '分类名称', type: 'text', placeholder: '例如：编程语言 / AI 技术栈' },
      { key: 'items', label: '技能条目', type: 'list', placeholder: '每行一条，例如：React、TypeScript、Python' },
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
      { key: 'description', label: '奖项描述', type: 'textarea', placeholder: '获奖背景、排名、影响力' },
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
      { key: 'description', label: '经历描述', type: 'list', placeholder: '每行一条，突出组织、协作、结果' },
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
      { key: 'description', label: '工作内容', type: 'list', placeholder: '每行一条，突出成果与量化指标' },
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
      { key: 'description', label: '工作成果', type: 'list', placeholder: '每行一条，突出业务价值' },
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
      { key: 'description', label: '证书说明', type: 'textarea', placeholder: '成绩、等级、有效期等' },
    ],
  },
  summary: {
    type: 'summary',
    title: '个人评价',
    description: '用 2-4 句概括你的优势与求职方向。',
    singularLabel: '个人评价',
    repeatable: false,
    fields: [{ key: 'content', label: '评价内容', type: 'textarea', placeholder: '例如：具备扎实的工程能力和良好的沟通协作能力。' }],
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
      { key: 'description', label: '详细说明', type: 'list', placeholder: '每行一条，描述成果与影响力' },
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
  fullName: '邓凯元',
  phone: '17802973369',
  email: '17802973369@163.com',
  gender: '男',
  age: '25',
  city: '陕西省宝鸡市',
  blog: '',
  headline: '具备 AI + 工程化双栈能力，擅长把复杂模型做成可交付产品。',
  targetRole: '算法工程师 / AI 应用开发',
  avatar: '',
};

export const createDefaultResume = (): ResumeData => ({
  personalInfo: defaultPersonalInfo,
  settings: {
    template: 'modern',
    accentColor: '#2563eb',
    previewMode: 'paged',
    showProfileHeader: true,
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
          school: '长春理工大学',
          major: '软件工程',
          degree: '硕士',
          dateRange: '2023.09 - 2026.07',
          description: '聚焦智能信息处理与计算机视觉方向。',
        },
        {
          school: '西安工业大学',
          major: '土木工程',
          degree: '本科',
          dateRange: '2018.09 - 2022.07',
          description: '完成结构建模、工程项目管理等课程学习。',
        },
      ],
    }),
    createSection('projects', {
      items: [
        {
          name: 'MICCAI 2025 国际医学影像挑战赛',
          role: '项目负责人',
          dateRange: '2025.08 - 2025.09',
          description: [
            '围绕低场 MRI 噪声抑制开展研究，改进扩散模型与条件引导采样流程。',
            '将 Docker 打包、推理脚本、一键提交流程串联，形成算法到工程闭环。',
            '作为个人选手进入复赛验证阶段，作品展示完整的工程化能力。',
          ],
        },
        {
          name: '本地知识库与网络查询学术 RAG 检索器',
          role: '全栈开发',
          dateRange: '2025.10 - 2025.11',
          description: [
            '基于 LlamaIndex 与 Gemini 2.5 Flash 搭建混合检索流水线。',
            '用 BGEM3 构建中文向量召回，融合 Arxiv 官方 API 实现多源检索。',
            '通过排序策略提升结果质量，输出可交付的学术检索 Agent。',
          ],
        },
      ],
    }),
    createSection('skills', {
      items: [
        { category: '编程语言', items: ['TypeScript', 'Python', 'SQL'] },
        { category: '前端工程', items: ['React', 'Vite', '状态管理', 'PDF 导出'] },
        { category: 'AI 技术栈', items: ['PyTorch', 'RAG', '多模态应用', 'Docker'] },
      ],
    }),
    createSection('awards', {
      items: [
        {
          name: 'MICCAI 2025 竞赛复赛入围',
          dateRange: '2025.09',
          description: '个人参赛作品进入复赛验证阶段，展示完整的算法与工程能力。',
        },
      ],
    }),
    createSection('campus', {
      items: [
        {
          name: '研究生技术分享会',
          role: '主讲人',
          dateRange: '2024.10 - 2025.01',
          description: ['组织 4 场主题分享，覆盖检索增强生成、前端工程化与模型部署。'],
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
          name: '大学英语六级',
          issuer: '全国大学英语四六级考试委员会',
          dateRange: '2021.12',
          description: '具备良好的英文文献阅读与技术资料检索能力。',
        },
      ],
    }),
    createSection('summary', {
      items: [
        {
          content:
            '具备扎实的工程实现能力和良好的产品化意识，能够独立完成从需求分析、原型设计到前后端联调与上线交付的完整流程。',
        },
      ],
    }),
  ],
  updatedAt: new Date().toISOString(),
});
