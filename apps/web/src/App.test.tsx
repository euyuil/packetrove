import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function enter(value: string) {
  fireEvent.change(screen.getByLabelText('IP addresses or CIDR ranges'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate covering CIDR' }));
}

describe('browser calculator', () => {
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
  it('displays precise IPv6 counts and canonical inputs', () => {
    render(<App />);
    enter('2001:DB8::7/64\n2001:db8:0:1::/64');
    expect(screen.getByText('2001:db8::/63')).toBeDefined();
    expect(screen.getAllByText('36,893,488,147,419,103,232')).toHaveLength(2);
    expect(screen.getByText('2001:db8::/64')).toBeDefined();
    expect(screen.getByText('Exact coverage: this CIDR adds no addresses.')).toBeDefined();
  });
  it('maps errors to actual input lines after ignoring blank lines', () => {
    render(<App />);
    enter('\n::1\n\nbad');
    expect(within(screen.getByRole('alert')).getByText(/^Line 4:/)).toBeDefined();
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
