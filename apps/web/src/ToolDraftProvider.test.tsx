import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, within } from '@testing-library/react';
import { App } from './App';
import { render } from './test-utils';
import { renderPage } from './prerender';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

it('isolates retained drafts between application instances', () => {
  window.history.replaceState({}, '', '/cidr-cover');
  const first = render(<App />);
  const firstPage = within(first.container);
  fireEvent.change(firstPage.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '203.0.113.1' } });
  fireEvent.click(firstPage.getByRole('button', { name: 'Calculate covering CIDR' }));
  // Each application owns its document's fixed input and result identifiers.
  const secondDocument = document.implementation.createHTMLDocument();
  const second = render(<App />, { container: secondDocument.body, baseElement: secondDocument.body });
  const secondPage = within(second.container);
  expect((secondPage.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('');
  expect(secondPage.queryByText('203.0.113.1/32')).toBeNull();
  fireEvent.click(firstPage.getByRole('link', { name: 'Home' }));
  fireEvent.click(firstPage.getByRole('link', { name: 'Smallest Covering CIDR' }));
  expect((firstPage.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('203.0.113.1');
  expect(firstPage.getAllByText('203.0.113.1/32')).toHaveLength(2);
  expect((secondPage.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('');
});

it('prerenders fresh defaults without reading a mounted application draft', () => {
  window.history.replaceState({}, '', '/cidr-cover');
  const mounted = render(<App />);
  fireEvent.change(within(mounted.container).getByLabelText('IP addresses or CIDR ranges'), {
    target: { value: '203.0.113.97' },
  });
  for (let index = 0; index < 2; index++) {
    const html = new DOMParser().parseFromString(renderPage('/cidr-cover'), 'text/html');
    expect(html.querySelector<HTMLTextAreaElement>('#addresses')?.value).toBe('');
    expect(html.body.textContent).not.toContain('203.0.113.97');
  }
  expect((within(mounted.container).getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value)
    .toBe('203.0.113.97');
});
