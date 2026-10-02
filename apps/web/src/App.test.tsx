import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CidrCoverResultSchema } from '@packetrove/contracts';
import * as core from '@packetrove/core';
import { App } from './App';
import { render } from './test-utils';

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

function enter(value: string) {
  fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
}

describe('web page routing', () => {
  it.each(['/', '/index.html'])('introduces the project at %s without opening a tool or querying an API', path => {
    window.history.replaceState({}, '', path);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Network tools for humans and agents', level: 1 })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Smallest Covering CIDR' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'My Public IP' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Smallest Covering CIDR' }).getAttribute('href')).toBe('/cidr');
    expect(screen.getByRole('link', { name: 'My Public IP' }).getAttribute('href')).toBe('/ip');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Calculate covering CIDR' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Refresh IP' })).toBeNull();
    expect(document.title).toBe('Packetrove — CIDR Calculator and Public IP Lookup');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the configured API and repository in quickstart examples and the linked MCP guide', () => {
    vi.stubEnv('VITE_API_ORIGIN', 'https://api.service.example');
    vi.stubEnv('VITE_GITHUB_REPOSITORY', 'example-owner/packetrove');
    vi.stubEnv('VITE_GIT_COMMIT', '');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const api = screen.getByRole('region', { name: 'Web API' });
    expect(api.textContent).toContain('curl -fsS https://api.service.example/v1/ip');
    expect(api.textContent).toContain("-H 'Accept: text/plain'");
    const cli = screen.getByRole('region', { name: 'Command-line interface' });
    expect(cli.textContent).toContain('git clone https://github.com/example-owner/packetrove.git');
    expect(within(cli).getByText('packetrove ip')).toBeDefined();
    const mcp = screen.getByRole('region', { name: 'Model Context Protocol' });
    expect(mcp.textContent).toContain('https://api.service.example/mcp');
    const guide = within(mcp).getByRole('link', { name: 'Read the MCP connection guide' });
    expect(guide.getAttribute('href')).toBe('/docs/mcp');
    fireEvent.click(guide);
    const main = screen.getByRole('main');
    expect(main.textContent).toContain('claude mcp add --transport http --scope user packetrove \\\n  https://api.service.example/mcp');
    expect(main.textContent).toContain('codex mcp add packetrove \\\n  --url https://api.service.example/mcp');
    expect(screen.getByRole('link', { name: 'Read the technical MCP guide in the repository (English)' }).getAttribute('href'))
      .toBe('https://github.com/example-owner/packetrove/blob/main/docs/integrations/mcp.md');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['/missing-page', '/ip/missing-page', '/cidr/missing-page', '/missing-page/'])('shows a missing page for %s without querying an API', path => {
    window.history.replaceState({}, '', path);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Page not found', level: 1 })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Return to home' }).getAttribute('href')).toBe('/');
    expect(screen.queryByLabelText('IP addresses or CIDR ranges')).toBeNull();
    expect(screen.getByRole('link', { name: 'Smallest Covering CIDR' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'My Public IP' }).getAttribute('aria-current')).toBeNull();
    expect(document.title).toBe('Page not found — Packetrove');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['/cidr', '/cidr/', '/cidr.html'])('opens the calculator directly at %s without querying an API', path => {
    window.history.replaceState({}, '', path);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Smallest Covering CIDR', level: 1 })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Smallest Covering CIDR' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
    expect(document.title).toBe('Smallest Covering CIDR Calculator — Packetrove');
    enter('203.0.113.1');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['/ip/', '/ip.html'])('recognizes the public IP page at %s', async path => {
    window.history.replaceState({}, '', path);
    vi.stubGlobal('fetch', async () => Response.json({ ip: '203.0.113.1', family: 'ipv4' }));
    render(<App />);
    expect(screen.getByRole('heading', { name: 'My Public IP', level: 1 })).toBeDefined();
    expect(screen.getByRole('link', { name: 'My Public IP' }).getAttribute('aria-current')).toBe('page');
    expect(document.title).toBe('What Is My IP? Public IP Lookup — Packetrove');
    expect(await screen.findByText('203.0.113.1')).toBeDefined();
  });
});

describe('GitHub source link', () => {
  it('links to the repository when build metadata is unavailable', () => {
    vi.stubEnv('VITE_GITHUB_REPOSITORY', '');
    vi.stubEnv('VITE_GIT_COMMIT', '');
    render(<App />);
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link.getAttribute('href')).toBe('https://github.com/euyuil/packetrove');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('uses the full build commit and repository while showing a short commit', () => {
    const commit = '0123456789abcdef0123456789abcdef01234567';
    vi.stubEnv('VITE_GITHUB_REPOSITORY', 'example-owner/packetrove');
    vi.stubEnv('VITE_GIT_COMMIT', commit);
    render(<App />);
    const link = screen.getByRole('link', { name: /^GitHub/ });
    expect(link.getAttribute('href')).toBe(`https://github.com/example-owner/packetrove/tree/${commit}`);
    expect(within(link).getByText('0123456')).toBeDefined();
    expect(link.getAttribute('title')).toContain(commit);
    expect(screen.getByRole('link', { name: 'Read the API guide' }).getAttribute('href'))
      .toBe('/docs/api');
  });
});

describe('browser calculator', () => {
  beforeEach(() => { window.history.replaceState({}, '', '/cidr'); });

  it('calculates locally without an API request and displays expansion', () => {
    const fetch = vi.fn(() => { throw new Error('Unexpected API request'); });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    enter('203.0.113.1\n203.0.113.2\n203.0.113.6');
    expect(screen.getByText('203.0.113.0/29')).toBeDefined();
    expect(screen.getByText('203.0.113.0')).toBeDefined();
    expect(screen.getByText('203.0.113.7')).toBeDefined();
    expect(screen.getByText('This CIDR adds 5 addresses. Applying it expands the addresses allowed or blocked by your list.')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('displays precise IPv6 counts and canonical inputs', async () => {
    const user = userEvent.setup();
    render(<App />);
    enter('2001:DB8::7/64\n2001:db8:0:1::/64');
    expect(screen.getByText('2001:db8::/63')).toBeDefined();
    expect(screen.getAllByText('36,893,488,147,419,103,232')).toHaveLength(2);
    const normalizedInputs = screen.getByRole('button', { name: 'Normalized inputs (2)' });
    expect(normalizedInputs.getAttribute('aria-expanded')).toBe('false');
    await user.click(normalizedInputs);
    expect(normalizedInputs.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('2001:db8::/64')).toBeDefined();
    expect(screen.getByText('Exact coverage: this CIDR adds no addresses.')).toBeDefined();
  });
  it('uses the shared core locally for equivalent dotted-tail IPv6 inputs', () => {
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    const fetch = vi.fn(() => { throw new Error('Unexpected API request'); });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    const inputs = ['::192.0.2.1', '::c000:201'];
    enter(inputs.join('\n'));
    expect(calculation).toHaveBeenCalledExactlyOnceWith({ inputs });
    const result = CidrCoverResultSchema.parse(calculation.mock.results[0]?.value);
    expect(result.cidr).toBe('::c000:201/128');
    expect(screen.getAllByText(result.cidr)).toHaveLength(3);
    for (const [label, count] of [
      ['Unique input addresses', result.inputAddressCount],
      ['Covered addresses', result.coveredAddressCount],
      ['Additional addresses', result.additionalAddressCount],
    ]) {
      expect(screen.getByText(label!).nextElementSibling?.textContent).toBe(count);
    }
    expect(screen.getByText('Exact coverage: this CIDR adds no addresses.')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('shows the full IPv6 range and exact 128-bit counts', () => {
    render(<App />);
    enter('2001:db8::/0');
    expect(screen.getByText('::')).toBeDefined();
    expect(screen.getByText('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBeDefined();
    expect(screen.getAllByText('340,282,366,920,938,463,463,374,607,431,768,211,456')).toHaveLength(2);
  });
  it('associates input instructions and validation errors with the textarea', () => {
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'IP addresses or CIDR ranges' });
    expect(input.getAttribute('aria-describedby')).toBe('input-help');
    expect(document.getElementById('input-help')?.textContent).toContain('One entry per line.');
    enter('invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.trim().split(/\s+/).sort()).toEqual(['input-error', 'input-help']);
    expect(document.getElementById('input-error')?.contains(screen.getByRole('alert'))).toBe(true);
    fireEvent.change(input, { target: { value: '203.0.113.1' } });
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('input-help');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('maps errors to actual input lines after ignoring blank lines', () => {
    render(<App />);
    enter('\n::1\n\nbad');
    expect(within(screen.getByRole('alert')).getByText(/^Line 4:/)).toBeDefined();
  });
  it.each(['\n', '\r\n'])('shows all invalid physical lines with %j separators without uploading inputs', separator => {
    const calculation = vi.spyOn(core, 'smallestCoveringCidr');
    const fetch = vi.fn(() => { throw new Error('Unexpected API request'); });
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    enter(['', '203.0.113.1', 'bad', '  ', '203.0.113.2', '::/129', ''].join(separator));
    expect(calculation).toHaveBeenCalledExactlyOnceWith({ inputs: ['203.0.113.1', 'bad', '203.0.113.2', '::/129'] });
    const alert = within(screen.getByRole('alert'));
    const issues = alert.getAllByRole('listitem');
    expect(issues).toHaveLength(2);
    expect(issues[0]?.textContent).toMatch(/^Line 3:/);
    expect(issues[1]?.textContent).toMatch(/^Line 6:/);
    expect(screen.queryByText('203.0.113.0/30')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects an empty list and a mixed address family', () => {
    render(<App />);
    enter('\n  \n');
    expect(screen.getByRole('alert')).toBeDefined();
    enter('::1\n203.0.113.1');
    expect(screen.getByText('Use either IPv4 or IPv6 throughout one calculation.')).toBeDefined();
  });
  it('clears results as soon as input changes', () => {
    render(<App />);
    enter('203.0.113.1');
    expect(screen.getAllByText('203.0.113.1/32')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value: '::1' } });
    expect(screen.queryByText('203.0.113.1/32')).toBeNull();
    expect(screen.getByText('Your result will appear here')).toBeDefined();
  });
  it('loads both examples and clears input', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'IPv4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
    expect(screen.getByText('203.0.113.0/29')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'IPv6' }));
    expect(screen.queryByText('203.0.113.0/29')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect((screen.getByLabelText('IP addresses or CIDR ranges') as HTMLTextAreaElement).value).toBe('');
  });
  it('copies the resulting CIDR', async () => {
    const user = userEvent.setup();
    render(<App />);
    enter('::1');
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(screen.getByRole('button', { name: 'Copy CIDR' }));
    expect(writeText).toHaveBeenCalledWith('::1/128');
    expect(screen.getByRole('status').textContent).toBe('CIDR copied.');
  });
  it('provides a useful message when clipboard access fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    render(<App />);
    enter('::1');
    await user.click(screen.getByRole('button', { name: 'Copy CIDR' }));
    expect(screen.getByRole('status').textContent).toBe('Copy is unavailable. Select and copy the CIDR above.');
  });
});
