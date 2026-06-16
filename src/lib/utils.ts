import type { WheelEvent as ReactWheelEvent } from 'react';

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Keep wheel scrolling contained to the hovered scrollable element so it does
// not bubble up and move the surrounding panels at the same time.
export const handleScrollableWheel = (event: ReactWheelEvent<HTMLElement>) => {
  const element = event.currentTarget;
  const maxScrollTop = element.scrollHeight - element.clientHeight;

  if (maxScrollTop <= 0) {
    return;
  }

  const nextScrollTop = clampNumber(element.scrollTop + event.deltaY, 0, maxScrollTop);

  if (nextScrollTop === element.scrollTop) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  element.scrollTop = nextScrollTop;
};

export const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));

export const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

export const joinMetaGroup = (values: string[]) => values.filter(Boolean).join(' ｜ ');
