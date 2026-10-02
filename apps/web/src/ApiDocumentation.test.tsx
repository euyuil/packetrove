import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CIDR_COVER_EXAMPLES, CidrCoverRequestSchema } from '@packetrove/contracts';
import specification from '../../../docs/api/openapi.json';
import { App } from './App';
import { render } from './test-utils';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('interactive API documentation', () => {
  it('loads only the specification and sends an explicit trial directly to the anonymous API', async () => {
    // JSDOM cannot create object URLs for Node fetch response blobs.
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:https://api.example/response');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const requests: Request[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      requests.push(request);
      return Response.json(new URL(request.url).pathname === '/v1/cidr/cover' ? CIDR_COVER_EXAMPLES[0]!.result : specification);
    });
    window.history.replaceState({}, '', '/docs/api');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'API documentation', level: 1 }, { timeout: 15_000 })).toBeDefined();
    await waitFor(() => {
      expect(screen.getAllByText('Find the smallest single CIDR covering all inputs').length).toBeGreaterThan(0);
    }, { timeout: 5_000 });
    expect(document.title).toBe('Packetrove API Documentation — CIDR and Public IP');
    expect(screen.getByRole('link', { name: /OpenAPI specification/ }).getAttribute('href'))
      .toBe('https://api.packetrove.com/openapi.json');
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every(request => request.url === 'https://api.packetrove.com/openapi.json'
      && request.credentials === 'omit')).toBe(true);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Test Request.*post \/v1\/cidr\/cover/i }, { timeout: 5_000 }));
    // JSDOM exposes both responsive variants of the same send button.
    const sendButtons = await screen.findAllByRole('button', {
      name: 'Send post request to https://api.packetrove.com/v1/cidr/cover',
    }, { timeout: 5_000 });
    await user.click(sendButtons[0]!);
    await waitFor(() => {
      expect(requests.some(request => request.url === 'https://api.packetrove.com/v1/cidr/cover'
        && request.method === 'POST' && request.credentials === 'omit')).toBe(true);
    }, { timeout: 5_000 });
    const trial = requests.find(request => request.method === 'POST')!;
    expect(CidrCoverRequestSchema.parse(await trial.json()).inputs.length).toBeGreaterThan(0);
    expect(requests.every(request => ['https://api.packetrove.com/openapi.json', 'https://api.packetrove.com/v1/cidr/cover']
      .includes(request.url))).toBe(true);
  }, 20_000);
});
