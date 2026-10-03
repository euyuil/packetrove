const textLayoutProperties = [
  'font-family', 'font-size', 'font-style', 'font-weight', 'font-variant', 'font-stretch',
  'font-kerning', 'font-feature-settings', 'font-variation-settings', 'line-height',
  'letter-spacing', 'word-spacing', 'text-indent', 'text-align', 'text-transform',
  'white-space', 'overflow-wrap', 'word-break', 'tab-size', 'direction',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
];

/** Focus a field and, when available, select and reveal its located textarea entry. */
export function focusErrorInput(input: HTMLElement | null, selection?: { start: number; end: number }) {
  if (!(input instanceof HTMLTextAreaElement) || !selection
    || !Number.isInteger(selection.start) || !Number.isInteger(selection.end)
    || selection.start < 0 || selection.start >= selection.end || selection.end > input.value.length) {
    input?.focus();
    return;
  }
  const { start, end } = selection;
  input.setSelectionRange(start, end);
  input.focus();
  if (input.clientWidth <= 0 || input.clientHeight <= 0) return;

  const mirror = document.createElement('div');
  try {
    const style = getComputedStyle(input);
    for (const property of textLayoutProperties) mirror.style.setProperty(property, style.getPropertyValue(property));
    Object.assign(mirror.style, {
      position: 'absolute', left: '-10000px', top: '0', visibility: 'hidden', pointerEvents: 'none',
      boxSizing: 'border-box', width: `${input.clientWidth}px`, border: '0', margin: '0',
    });
    // clientWidth excludes the native scrollbar; the mirror uses the same padding and content width.
    if (!style.whiteSpace) mirror.style.whiteSpace = input.wrap === 'off' ? 'pre' : 'pre-wrap';
    if (!style.overflowWrap) mirror.style.overflowWrap = input.wrap === 'off' ? 'normal' : 'break-word';
    mirror.setAttribute('aria-hidden', 'true');
    const marker = document.createElement('span');
    marker.textContent = input.value.slice(start, end);
    mirror.append(document.createTextNode(input.value.slice(0, start)), marker,
      document.createTextNode(input.value.slice(end)));
    document.body.append(mirror);

    const origin = mirror.getBoundingClientRect().top;
    let top = Infinity;
    let bottom = -Infinity;
    for (const rect of marker.getClientRects()) {
      if (!Number.isFinite(rect.top) || !Number.isFinite(rect.bottom) || !Number.isFinite(rect.height) || rect.height <= 0) continue;
      top = Math.min(top, rect.top - origin);
      bottom = Math.max(bottom, rect.bottom - origin);
    }
    const paddingTop = Number.parseFloat(style.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
    const visibleHeight = input.clientHeight - paddingTop - paddingBottom;
    if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= top || visibleHeight <= 0) return;
    if (top < input.scrollTop + paddingTop) {
      input.scrollTop = Math.max(0, top - paddingTop);
    } else if (bottom > input.scrollTop + input.clientHeight - paddingBottom) {
      input.scrollTop = Math.max(0, bottom - top > visibleHeight
        ? top - paddingTop : bottom - input.clientHeight + paddingBottom);
    }
  } catch {
    // Exact selection and focus still work when layout cannot be measured.
    return;
  } finally {
    mirror.remove();
  }
}
