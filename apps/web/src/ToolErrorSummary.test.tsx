import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolErrorSummary } from './ToolErrorSummary';
import { render } from './test-utils';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('shared error focus and selection', () => {
  it('selects an entire invalid entry at the start and end of the textarea', async () => {
    const user = userEvent.setup();
    let selectionOnFocus: number[] | undefined;
    render(<>
      <textarea id="address-list" defaultValue="bad" onFocus={event => {
        selectionOnFocus = [event.currentTarget.selectionStart, event.currentTarget.selectionEnd];
      }} />
      <ToolErrorSummary id="errors" title="Invalid input" ref={null}
        issues={[{ inputId: 'address-list', message: 'Fix this entry', selection: { start: 0, end: 3 } }]} />
    </>);
    const input = document.getElementById('address-list') as HTMLTextAreaElement;
    input.setSelectionRange(3, 3);
    await user.click(screen.getByRole('link', { name: 'Fix this entry' }));
    expect(document.activeElement).toBe(input);
    expect(selectionOnFocus).toEqual([0, 3]);
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 3]);
    expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe('bad');
  });

  it.each([
    undefined, { start: -1, end: 3 }, { start: 0, end: 4 }, { start: 3, end: 1 },
    { start: 1, end: 1 }, { start: 0.5, end: 3 }, { start: 0, end: NaN },
  ])('keeps focus without applying an unavailable or invalid token range %j', async selection => {
    const user = userEvent.setup();
    render(<>
      <textarea id="address-list" defaultValue="bad" />
      <ToolErrorSummary id="errors" title="Invalid input" ref={null}
        issues={[{ inputId: 'address-list', message: 'Fix this entry', selection }]} />
    </>);
    const input = document.getElementById('address-list') as HTMLTextAreaElement;
    input.setSelectionRange(3, 3);
    const select = vi.spyOn(input, 'setSelectionRange');
    await user.click(screen.getByRole('link', { name: 'Fix this entry' }));
    expect(document.activeElement).toBe(input);
    expect(select).not.toHaveBeenCalled();
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
  });

  it('leaves a single-value field focused without applying textarea selection', async () => {
    const user = userEvent.setup();
    render(<>
      <input id="start-address" defaultValue="bad" />
      <ToolErrorSummary id="errors" title="Invalid input" ref={null}
        issues={[{ inputId: 'start-address', message: 'Fix the start address', selection: { start: 0, end: 3 } }]} />
    </>);
    const input = document.getElementById('start-address') as HTMLInputElement;
    const select = vi.spyOn(input, 'setSelectionRange');
    await user.click(screen.getByRole('link', { name: 'Fix the start address' }));
    expect(document.activeElement).toBe(input);
    expect(select).not.toHaveBeenCalled();
  });
});

function measuredTextarea(rectangles: DOMRect[], scrollTop: number, failMeasurement = false, wrap = 'soft') {
  const text = '<b>bad</b>, bad';
  render(<>
    <textarea id="address-list" defaultValue={text} wrap={wrap} style={{
      width: '202px', boxSizing: 'border-box', padding: '10px', fontFamily: 'monospace', fontSize: '14px',
      lineHeight: '20px', tabSize: 8, whiteSpace: wrap === 'off' ? 'pre' : 'pre-wrap',
      overflowWrap: wrap === 'off' ? 'normal' : 'anywhere',
    }} />
    <ToolErrorSummary id="errors" title="Invalid input" ref={null}
      issues={[{ inputId: 'address-list', message: 'Fix this entry', selection: { start: 12, end: 15 } }]} />
  </>);
  const input = document.getElementById('address-list') as HTMLTextAreaElement;
  // Simulate a native scrollbar: clientWidth has less space than the styled outer width.
  Object.defineProperties(input, { clientWidth: { value: 180 }, clientHeight: { value: 100 } });
  input.scrollTop = scrollTop;
  const measurement: { mirror?: HTMLElement; marker?: HTMLElement } = {};
  const originalBounds = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.tagName === 'DIV' && this.getAttribute('aria-hidden') === 'true'
      ? new DOMRect(0, 100, 180, 500) : originalBounds.call(this);
  });
  const originalRects = HTMLElement.prototype.getClientRects;
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (this: HTMLElement) {
    if (this.tagName === 'SPAN' && this.parentElement?.getAttribute('aria-hidden') === 'true') {
      measurement.mirror = this.parentElement;
      measurement.marker = this;
      if (failMeasurement) throw new Error('Layout unavailable');
      return rectangles as unknown as DOMRectList;
    }
    return originalRects.call(this);
  });
  return { input, measurement, text };
}

describe('textarea visibility with simulated layout', () => {
  it.each([
    { name: 'above the viewport', scrollTop: 300, rects: [new DOMRect(0, 120, 10, 20)], expected: 10 },
    { name: 'below the viewport', scrollTop: 0, rects: [new DOMRect(0, 280, 10, 20)], expected: 110 },
    { name: 'already visible', scrollTop: 20, rects: [new DOMRect(0, 140, 10, 20)], expected: 20 },
    { name: 'wrapped over two rows', scrollTop: 0, rects: [new DOMRect(0, 220, 10, 20), new DOMRect(0, 240, 10, 20)], expected: 70 },
    { name: 'taller than the viewport', scrollTop: 0, rects: [new DOMRect(0, 220, 10, 20), new DOMRect(0, 330, 10, 20)], expected: 110 },
  ])('reveals the located entry $name by scrolling only its textarea', async ({ scrollTop, rects, expected }) => {
    const user = userEvent.setup();
    const { input, measurement, text } = measuredTextarea(rects, scrollTop);
    const scrollWindow = vi.spyOn(window, 'scrollTo');
    await user.click(screen.getByRole('link', { name: 'Fix this entry' }));
    expect(input.scrollTop).toBe(expected);
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([12, 15]);
    expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe('bad');
    expect(input.value).toBe(text);
    expect(measurement.mirror?.isConnected).toBe(false);
    expect(scrollWindow).not.toHaveBeenCalled();
  });

  it.each(['soft', 'off'])('copies actual width and text layout for wrap=%s without interpreting text as HTML', async wrap => {
    const user = userEvent.setup();
    const { measurement, text } = measuredTextarea([new DOMRect(0, 120, 10, 20)], 300, false, wrap);
    await user.click(screen.getByRole('link', { name: 'Fix this entry' }));
    const mirror = measurement.mirror!;
    expect(mirror.textContent).toBe(text);
    expect(mirror.querySelector('b')).toBeNull();
    expect(mirror.style.width).toBe('180px');
    expect(mirror.style.boxSizing).toBe('border-box');
    expect(mirror.style.fontFamily).toBe('monospace');
    expect(mirror.style.fontSize).toBe('14px');
    expect(mirror.style.lineHeight).toBe('20px');
    expect(mirror.style.paddingTop).toBe('10px');
    expect(mirror.style.tabSize).toBe('8');
    expect(mirror.style.whiteSpace).toBe(wrap === 'off' ? 'pre' : 'pre-wrap');
    expect(mirror.style.overflowWrap).toBe(wrap === 'off' ? 'normal' : 'anywhere');
    expect(measurement.marker?.textContent).toBe('bad');
    expect(measurement.marker?.style.cssText).toBe('');
    expect(mirror.isConnected).toBe(false);
  });

  it.each([false, true])('keeps exact selection and removes the mirror when layout is unavailable (throws=%s)', async failMeasurement => {
    const user = userEvent.setup();
    const { input, measurement } = measuredTextarea([], 300, failMeasurement);
    await user.click(screen.getByRole('link', { name: 'Fix this entry' }));
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([12, 15]);
    expect(input.scrollTop).toBe(300);
    expect(measurement.mirror?.isConnected).toBe(false);
  });
});
