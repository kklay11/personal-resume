const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'resume';

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/'/g, '&#39;');

const collectDocumentStyles = () =>
  Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');

const collectResumeCssVariables = (container: HTMLElement) => {
  const source = container.closest('.app-shell');

  if (!source) {
    return '';
  }

  const computedStyle = window.getComputedStyle(source);
  const variableNames = [
    '--accent-color',
    '--resume-title-size',
    '--resume-content-size',
    '--resume-line-height',
    '--resume-avatar-ratio',
    '--resume-section-gap',
    '--resume-margin-top',
    '--resume-margin-bottom',
    '--resume-margin-left',
    '--resume-margin-right',
  ];

  return variableNames
    .map((name) => `${name}: ${computedStyle.getPropertyValue(name).trim()};`)
    .join(' ');
};

const PRINT_CSS = `
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-root {
      background: #ffffff;
    }

    .preview-pages {
      display: block !important;
      padding: 0 !important;
      gap: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    .resume-paper {
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border: none !important;
      break-after: page;
      page-break-after: always;
    }

    .resume-paper:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  </style>
`;

export const exportResumePdf = async (container: HTMLElement, fileName: string) => {
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.resume-paper'));

  if (pages.length === 0) {
    throw new Error('未找到可导出的简历页面。');
  }

  if ('fonts' in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 1000);
  };

  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument;

  if (!iframeWindow || !iframeDocument) {
    iframe.remove();
    throw new Error('无法创建打印上下文，请稍后重试。');
  }

  const wrapperStyle = collectResumeCssVariables(container);
  const styleMarkup = collectDocumentStyles();
  const title = sanitizeFileName(fileName);

  iframeDocument.open();
  iframeDocument.write(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${styleMarkup}
        ${PRINT_CSS}
      </head>
      <body>
        <div class="print-root" style='${escapeAttribute(wrapperStyle)}'>
          <div class="preview-pages">${container.innerHTML}</div>
        </div>
      </body>
    </html>
  `);
  iframeDocument.close();

  await new Promise<void>((resolve) => {
    const finish = () => window.setTimeout(resolve, 300);

    if (iframeDocument.readyState === 'complete') {
      finish();
      return;
    }

    iframe.addEventListener('load', finish, { once: true });
  });

  if ('fonts' in iframeDocument) {
    await (iframeDocument as Document & { fonts: FontFaceSet }).fonts.ready;
  }

  iframeWindow.focus();
  iframeWindow.print();
  cleanup();
};
