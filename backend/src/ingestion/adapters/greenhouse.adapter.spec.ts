import { GreenhouseAdapter } from './greenhouse.adapter';

describe('GreenhouseAdapter', () => {
  const adapter = new GreenhouseAdapter();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes Greenhouse jobs and strips HTML', async () => {
    const payload = {
      jobs: [
        {
          id: 42,
          title: 'Account Executive',
          location: { name: 'London, UK' },
          content: '<p>Sell &amp; grow our pipeline</p>',
          absolute_url: 'https://boards.greenhouse.io/acme/jobs/42',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 200 }),
      );

    const postings = await adapter.fetchPostings('acme', 'Acme');

    expect(postings).toHaveLength(1);
    expect(postings[0]).toMatchObject({
      provider: 'greenhouse',
      externalId: '42',
      company: 'Acme',
      companySlug: 'acme',
      title: 'Account Executive',
      location: 'London, UK',
      url: 'https://boards.greenhouse.io/acme/jobs/42',
    });
    expect(postings[0].description).toBe('Sell & grow our pipeline');
  });

  it('throws on a non-200 response', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('not found', { status: 404 }));

    await expect(adapter.fetchPostings('missing', 'Missing')).rejects.toThrow();
  });
});
