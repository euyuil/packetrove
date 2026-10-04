import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { certificateFixtures, CERTIFICATE_BUNDLE_SAMPLES } from '@packetrove/contracts';
import * as core from '@packetrove/core/certificate-bundle';
import { App } from './App';
import { render } from './test-utils';

beforeEach(() => {
  window.history.replaceState({}, '', '/certificate-bundle');
  vi.stubGlobal('crypto', webcrypto);
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});
const pemInput = () => screen.getByLabelText('PEM certificates') as HTMLTextAreaElement;
function enter(pem: string, hostname = '') {
  fireEvent.change(pemInput(), { target: { value: pem } });
  fireEvent.change(screen.getByLabelText('Expected hostname (optional)'), { target: { value: hostname } });
  fireEvent.click(screen.getByRole('button', { name: 'Check certificate bundle' }));
}
const completed = () => waitFor(() => expect(screen.getByRole('status', { name: 'Check results' }).textContent).toContain('Check complete.'));

describe('the integrated certificate checker', () => {
  it('opens blank without checks, uploads, storage writes, or input-bearing URLs', () => {
    const checker = vi.spyOn(core, 'checkCertificateBundle');
    const network = vi.fn(); vi.stubGlobal('fetch', network);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Certificate Bundle Checker', level: 1 })).toBeDefined();
    expect(pemInput().value).toBe('');
    expect(checker).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(window.location.search + window.location.hash).toBe('');
  });

  it('verifies locally and displays number plus CN only on rounded graph nodes', async () => {
    const network = vi.fn(); vi.stubGlobal('fetch', network);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const log = vi.spyOn(console, 'log');
    render(<App />);
    enter(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem, 'service.example.com');
    await completed();
    const graph = screen.getByRole('img', { name: /Certificate issuer graph/ });
    expect(graph.querySelector('text')?.textContent).toBe('#1 service.example.com');
    expect(graph.querySelectorAll('rect')).toHaveLength(3);
    expect(graph.querySelector('rect')?.getAttribute('rx')).toBe('12');
    const table = screen.getByRole('table');
    expect(table.textContent).toContain('#1 → #2');
    expect(table.textContent).not.toContain('service.example.com');
    expect(screen.getByText(/DNS SAN matches/)).toBeDefined();
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/certificate-bundle');
    fireEvent.change(pemInput(), { target: { value: certificateFixtures.leaf } });
    expect(screen.queryByRole('img', { name: /Certificate issuer graph/ })).toBeNull();
  });

  it('focuses an original input location when a private-key block follows valid certificates', async () => {
    render(<App />);
    const marker = '\n-----BEGIN PRIVATE KEY-----\nPRIVATE-PAYLOAD\n-----END PRIVATE KEY-----';
    enter(certificateFixtures.leaf + marker);
    const link = await screen.findByRole('link', { name: /Line/ });
    fireEvent.click(link);
    expect(document.activeElement).toBe(pemInput());
    expect(pemInput().selectionStart).toBe(certificateFixtures.leaf.length + 1);
    expect(screen.queryByRole('img', { name: /Certificate issuer graph/ })).toBeNull();
    expect(link.textContent).not.toContain('PRIVATE-PAYLOAD');
  });

  it('requires a leaf choice and recomputes its hostname check without changing original positions', async () => {
    render(<App />);
    enter([certificateFixtures.leaf, certificateFixtures.leafTwo, certificateFixtures.intermediate].join('\n'), 'service.example.com');
    await completed();
    expect(screen.getByText('Select the intended leaf before checking this hostname.')).toBeDefined();
    fireEvent.click(screen.getByRole('combobox', { name: 'Leaf for hostname checking' }));
    fireEvent.click(screen.getByRole('option', { name: /#1 CN=service.example.com/ }));
    await waitFor(() => expect(screen.getByText(/DNS SAN matches/)).toBeDefined());
    expect(screen.getByRole('table').textContent).toContain('#2 → #3');
  });

  it('keeps input and completed results across tool and language navigation, then starts blank in a new app', async () => {
    const checker = vi.spyOn(core, 'checkCertificateBundle');
    const first = render(<App />);
    enter(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem);
    await completed();
    fireEvent.click(screen.getByRole('link', { name: 'CIDR Subtraction' }));
    fireEvent.click(screen.getByRole('link', { name: 'Certificate Bundle Checker' }));
    expect(pemInput().value).toBe(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem);
    expect(screen.getByRole('img', { name: /Certificate issuer graph/ })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /^Language:/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /中文/ }));
    await waitFor(() => expect(window.location.pathname).toBe('/zh/certificate-bundle'));
    expect((screen.getByLabelText('PEM 证书') as HTMLTextAreaElement).value).toBe(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem);
    expect(checker).toHaveBeenCalledOnce();
    first.unmount();
    render(<App />);
    expect((screen.getByLabelText('PEM 证书') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
