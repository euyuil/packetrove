import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('keeps all ten examples behind a secondary action and fills inputs without checking', async () => {
    const user = userEvent.setup();
    const checker = vi.spyOn(core, 'checkCertificateBundle');
    const network = vi.fn(); vi.stubGlobal('fetch', network);
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Check results' })).toBeNull();
    const input = screen.getByRole('region', { name: 'Certificate input' });
    expect(input.querySelector('textarea, input, button')).toBe(pemInput());
    const opener = screen.getByRole('button', { name: 'Try an example' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Synthetic certificate examples' });
    const choices = within(dialog).getByRole('group', { name: 'Synthetic certificate examples' });
    expect(within(choices).getAllByRole('button')).toHaveLength(CERTIFICATE_BUNDLE_SAMPLES.length);
    await user.click(within(dialog).getByRole('button', { name: 'Normal bundle' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(pemInput().value).toBe(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem);
    expect((screen.getByLabelText('Expected hostname (optional)') as HTMLInputElement).value).toBe('service.example.com');
    await waitFor(() => expect(document.activeElement === opener).toBe(true));
    expect(screen.queryByRole('region', { name: 'Check results' })).toBeNull();
    expect(checker).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Check certificate bundle' }));
    await completed();
    expect(checker).toHaveBeenCalledOnce();
  });

  it('preserves a completed check when browsing examples and clears it only when loading a new bundle', async () => {
    const user = userEvent.setup();
    const checker = vi.spyOn(core, 'checkCertificateBundle');
    render(<App />);
    enter(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem, 'service.example.com');
    await completed();
    const graph = screen.getByRole('img', { name: /Certificate issuer graph/ });
    await user.click(screen.getByRole('button', { name: 'Try an example' }));
    expect(graph.isConnected).toBe(true);
    expect(pemInput().value).toBe(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem);
    await user.click(screen.getByRole('button', { name: 'Close examples' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('img', { name: /Certificate issuer graph/ })).toBe(graph);
    await user.click(screen.getByRole('button', { name: 'Try an example' }));
    await user.click(screen.getByRole('button', { name: 'Expired certificate' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(pemInput().value).toBe(CERTIFICATE_BUNDLE_SAMPLES.find(sample => sample.name === 'expired')!.request.pem);
    expect(screen.queryByRole('region', { name: 'Check results' })).toBeNull();
    expect(checker).toHaveBeenCalledOnce();
  });

  it('puts findings before relationships and reveals evidence and certificate details on request', async () => {
    render(<App />);
    enter(CERTIFICATE_BUNDLE_SAMPLES[0]!.request.pem, 'service.example.com');
    await completed();
    const input = screen.getByRole('region', { name: 'Certificate input' });
    const report = screen.getByRole('region', { name: 'Check results' });
    const relationships = screen.getByRole('region', { name: 'Issuer relationships' });
    expect(input.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(report.compareDocumentPosition(relationships) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(report).getAllByText('Next action:').length).toBeGreaterThan(0);
    expect(within(report).queryByText('HOSTNAME_MATCH')).toBeNull();
    fireEvent.click(within(report).getByRole('button', { name: /Evidence: Expected hostname matches/ }));
    expect(within(report).getByText('HOSTNAME_MATCH')).toBeDefined();
    const details = screen.getByRole('region', { name: 'Certificate details · Original order' });
    const certificate = within(details).getByRole('button', { name: /#1 Non-CA certificate/ });
    expect(certificate.getAttribute('aria-expanded')).toBe('false');
    expect(within(details).getAllByRole('button').every(button => button.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(within(details).queryByRole('textbox', { name: 'Structured result JSON' })).toBeNull();
    fireEvent.click(certificate);
    const certificateContent = await within(details).findByRole('region', { name: /#1 Non-CA certificate/ });
    expect(within(certificateContent).getByText('SHA-256 fingerprint')).toBeDefined();
    fireEvent.click(within(details).getByRole('button', { name: 'Structured result JSON' }));
    const jsonInput = await within(details).findByRole('textbox', { name: 'Structured result JSON' });
    const json = JSON.parse((jsonInput as HTMLTextAreaElement).value);
    expect(json.certificates).toHaveLength(3);
    expect(json.findings.some((finding: { code: string }) => finding.code === 'HOSTNAME_MATCH')).toBe(true);
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
