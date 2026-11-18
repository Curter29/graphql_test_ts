import { fetch, Response } from '@whatwg-node/fetch';
import { getBuiltMesh } from '../../.mesh';
import nasaFeed from '../fixtures/nasa_neo_1.json';
import { yoga } from '../exectuor';

jest.mock('@whatwg-node/fetch', () => ({
  ...jest.requireActual('@whatwg-node/fetch'),
  fetch: jest.fn(),
}));

describe('nearEarthObjects integration', () => {
  beforeEach(() => {
    jest.mocked(fetch).mockReset();
  });

  afterEach(async () => {
    const mesh = await getBuiltMesh();
    await mesh.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const fetchFeed = async (startDate = '2015-09-07', endDate = '2015-09-08') => {
    const query = `
      query ($startDate: String!, $endDate: String!) {
        nearEarthObjects(startDate: $startDate, endDate: $endDate) {
          elementCount
          objects {
            id
          }
        }
      }
    `;

    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', client: 'test' },
      body: JSON.stringify({ query, variables: { startDate, endDate } }),
    });
    return response.json();
  };

  const nasaResponse = () => new Response(JSON.stringify(nasaFeed), {
    headers: { 'content-type': 'application/json' },
  });

  test('reuses the NASA response for the same dates and generates a new requestId', async () => {
    const nasaFetch = jest.mocked(fetch).mockImplementation(async () => nasaResponse());

    const first = await fetchFeed();
    const second = await fetchFeed();

    expect(first.errors).toBeUndefined();
    expect(second.errors).toBeUndefined();
    expect(second.data).toEqual(first.data);
    expect(nasaFetch).toHaveBeenCalledTimes(1);
    expect(second.metadata.requestId).not.toBe(first.metadata.requestId);
  });

  test('fetches separate NASA responses for different date ranges', async () => {
    const nasaFetch = jest.mocked(fetch).mockImplementation(async () => nasaResponse());

    const first = await fetchFeed();
    const second = await fetchFeed('2015-09-07', '2015-09-09');
    const third = await fetchFeed('2015-09-06', '2015-09-08');

    expect(first.errors).toBeUndefined();
    expect(second.errors).toBeUndefined();
    expect(third.errors).toBeUndefined();
    expect(nasaFetch).toHaveBeenCalledTimes(3);
  });

  test('fetches a fresh NASA response after five minutes', async () => {
    await getBuiltMesh();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    const nasaFetch = jest.mocked(fetch).mockImplementation(async () => nasaResponse());

    const first = await fetchFeed();
    await jest.advanceTimersByTimeAsync(299_000);
    const cached = await fetchFeed();
    expect(nasaFetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1_001);
    const refreshed = await fetchFeed();

    expect(first.errors).toBeUndefined();
    expect(cached.errors).toBeUndefined();
    expect(refreshed.errors).toBeUndefined();
    expect(nasaFetch).toHaveBeenCalledTimes(2);
  });

  test('does not cache a failed NASA request', async () => {
    const nasaFetch = jest.mocked(fetch)
      .mockRejectedValue(new Error('NASA unavailable'));

    const failed = await fetchFeed();
    expect(nasaFetch).toHaveBeenCalled();
    const failedCalls = nasaFetch.mock.calls.length;
    nasaFetch.mockImplementation(async () => nasaResponse());
    const recovered = await fetchFeed();

    expect(failed).toMatchObject({ errors: expect.any(Array) });
    expect(recovered.errors).toBeUndefined();
    expect(recovered.data.nearEarthObjects.elementCount).toBe(21);
    expect(nasaFetch).toHaveBeenCalledTimes(failedCalls + 1);
  });

  test('fetches the NASA feed through Mesh and exposes mapped objects through Yoga', async () => {
    expect(process.env.NASA_API_KEY).toEqual(expect.stringMatching(/\S/));

    const nasaFetch = jest.mocked(fetch);
    nasaFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(nasaFeed), {
        headers: { 'content-type': 'application/json' },
      }),
    );

    const query = `
      query ($startDate: String!, $endDate: String!) {
        nearEarthObjects(startDate: $startDate, endDate: $endDate) {
          elementCount
          objects {
            id
            name
            isPotentiallyHazardousAsteroid
            estimatedDiameterMinKm
            estimatedDiameterMaxKm
            closeApproachDate
            relativeVelocityKph
            missDistanceKm
          }
        }
      }
    `;

    const variables = { startDate: '2015-09-07', endDate: '2015-09-08' };

    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', client: 'test' },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.errors).toBeUndefined();
    expect(result.metadata).toEqual({ requestId: expect.any(String) });
    expect(nasaFetch).toHaveBeenCalledTimes(1);
    const nasaUrl = new URL(String(nasaFetch.mock.calls[0][0]));
    expect(nasaUrl.origin + nasaUrl.pathname).toBe('https://api.nasa.gov/neo/rest/v1/feed');
    expect(Object.fromEntries(nasaUrl.searchParams)).toEqual({
      start_date: '2015-09-07',
      end_date: '2015-09-08',
      api_key: process.env.NASA_API_KEY,
    });

    const feed = result.data.nearEarthObjects;
    expect(feed.elementCount).toBe(21);
    expect(feed.objects).toHaveLength(21);
    expect(feed.objects.map((object: { id: string }) => object.id)).toEqual(
      Object.values(nasaFeed.near_earth_objects).flat().map(object => object.id),
    );
    expect(feed.objects[0]).toEqual({
      id: '2465633',
      name: '465633 (2009 JR5)',
      isPotentiallyHazardousAsteroid: true,
      estimatedDiameterMinKm: 0.2170475943,
      estimatedDiameterMaxKm: 0.4853331752,
      closeApproachDate: '2015-09-08',
      relativeVelocityKph: '65260.5699103704',
      missDistanceKm: '45290298.225725659',
    });
    expect(feed.objects[20]).toEqual({
      id: '3986741',
      name: '(2020 BY)',
      isPotentiallyHazardousAsteroid: false,
      estimatedDiameterMinKm: 0.0334622374,
      estimatedDiameterMaxKm: 0.0748238376,
      closeApproachDate: '2015-09-07',
      relativeVelocityKph: '97883.7299230601',
      missDistanceKm: '60851422.512182764',
    });
  });
});
