import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'resume';

export const exportResumePdf = async (container: HTMLElement, fileName: string) => {
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.resume-paper'));

  if (pages.length === 0) {
    throw new Error('未找到可导出的简历页面。');
  }

  if ('fonts' in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (const [index, page] of pages.entries()) {
    const canvas = await html2canvas(page, {
      scale: window.devicePixelRatio > 1 ? 2.5 : 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    if (index > 0) {
      pdf.addPage();
    }

    const renderedHeight = (canvas.height * pageWidth) / canvas.width;

    if (renderedHeight <= pageHeight) {
      const image = canvas.toDataURL('image/png');
      pdf.addImage(image, 'PNG', 0, 0, pageWidth, renderedHeight, `resume-page-${index}`, 'FAST');
      continue;
    }

    const slicePixelHeight = Math.floor((pageHeight * canvas.width) / pageWidth);
    let offsetY = 0;
    let sliceIndex = 0;

    while (offsetY < canvas.height) {
      const currentSliceHeight = Math.min(slicePixelHeight, canvas.height - offsetY);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = currentSliceHeight;

      const context = sliceCanvas.getContext('2d');

      if (!context) {
        throw new Error('PDF 导出失败：无法创建画布上下文。');
      }

      context.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        currentSliceHeight,
        0,
        0,
        canvas.width,
        currentSliceHeight,
      );

      const sliceHeight = (currentSliceHeight * pageWidth) / canvas.width;
      const image = sliceCanvas.toDataURL('image/png');

      if (sliceIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        image,
        'PNG',
        0,
        0,
        pageWidth,
        sliceHeight,
        `resume-page-${index}-slice-${sliceIndex}`,
        'FAST',
      );

      offsetY += currentSliceHeight;
      sliceIndex += 1;
    }
  }

  pdf.save(`${sanitizeFileName(fileName)}.pdf`);
};
