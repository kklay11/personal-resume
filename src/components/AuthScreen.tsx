interface AuthScreenProps {
  authReady: boolean;
  authMode: 'sign-in' | 'sign-up';
  email: string;
  password: string;
  isSubmitting: boolean;
  cloudEnabled: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onModeToggle: () => void;
  onSubmit: () => void;
}

export const AuthScreen = ({
  authReady,
  authMode,
  email,
  password,
  isSubmitting,
  cloudEnabled,
  onEmailChange,
  onPasswordChange,
  onModeToggle,
  onSubmit,
}: AuthScreenProps) => (
  <div className="auth-shell">
    <div className="auth-card">
      <div className="auth-card__hero">
        <div className="auth-badge">Resume Builder</div>
        <h1>登录后继续打磨你的简历</h1>
        <p>云端自动保存、多份简历切换、高清 PDF 导出都在这里。</p>
        <div className="auth-preview">
          <div className="auth-preview__paper">
            <div className="auth-preview__title" />
            <div className="auth-preview__line auth-preview__line--short" />
            <div className="auth-preview__line" />
            <div className="auth-preview__line" />
            <div className="auth-preview__section" />
            <div className="auth-preview__line" />
            <div className="auth-preview__line auth-preview__line--short" />
          </div>
        </div>
      </div>

      <div className="auth-card__form">
        <div className="section-intro">
          <h2>{authMode === 'sign-in' ? '欢迎回来' : '创建账号'}</h2>
          <p>{authMode === 'sign-in' ? '使用邮箱和密码登录，继续编辑云端简历。' : '注册后即可开始保存和管理你的多份简历。'}</p>
        </div>

        {cloudEnabled ? null : <div className="status-chip">未配置 Supabase，当前仅支持本地保存</div>}

        <label className="field">
          <span>邮箱</span>
          <input
            value={email}
            placeholder="name@example.com"
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={!authReady || isSubmitting}
          />
        </label>

        <label className="field">
          <span>密码</span>
          <input
            type="password"
            value={password}
            placeholder="至少 6 位"
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={!authReady || isSubmitting}
          />
        </label>

        <div className="auth-card__actions">
          <button type="button" className="primary-button" onClick={onSubmit} disabled={!authReady || isSubmitting || !cloudEnabled}>
            {isSubmitting ? '提交中...' : authMode === 'sign-in' ? '登录并继续' : '注册账号'}
          </button>
          <button type="button" className="ghost-button" onClick={onModeToggle} disabled={!authReady || isSubmitting}>
            {authMode === 'sign-in' ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
