import type { IncomingMessage, ServerResponse } from 'node:http';

export interface LiveImdbPerson {
  id: number;
  rank: number;
  imdbId?: string;
  name: string;
  profession: string;
  imageUrl: string;
  starmeterChange: number;
  knownFor: string[];
  bio: string;
}

function extractFromNextData(html: string): LiveImdbPerson[] {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match?.[1]) return [];

  try {
    const data = JSON.parse(match[1]);
    const edges =
      data?.props?.pageProps?.pageData?.chartNames?.edges ||
      data?.props?.pageProps?.pageData?.chartTitles?.edges ||
      [];

    if (!Array.isArray(edges) || edges.length === 0) return [];

    const results: LiveImdbPerson[] = [];
    for (let idx = 0; idx < Math.min(edges.length, 100); idx++) {
      const edge = edges[idx];
      const node = edge?.node || edge;
      const rank = edge?.currentRank ?? idx + 1;
      const prevRank = edge?.previousRank;
      const starmeterChange =
        typeof prevRank === 'number' && typeof rank === 'number' ? prevRank - rank : 0;

      const name = node?.nameText?.text || node?.titleText?.text;
      if (!name) continue;

      const primaryProfessions = Array.isArray(node?.primaryProfessions)
        ? node.primaryProfessions
            .map((p: { category?: { text?: string } }) => p?.category?.text)
            .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
            .slice(0, 2)
        : [];

      const knownForEdges = node?.knownFor?.edges;
      const knownFor = Array.isArray(knownForEdges)
        ? knownForEdges
            .map((k: { node?: { title?: { titleText?: { text?: string } } } }) => k?.node?.title?.titleText?.text)
            .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
            .slice(0, 3)
        : [];

      const imageUrl = node?.primaryImage?.url || '';
      const bio = node?.bio?.text?.plainText || `${name} is trending on IMDbPro STARmeter Top 100.`;

      results.push({
        id: idx + 1,
        rank,
        imdbId: node?.id,
        name,
        profession: primaryProfessions.length > 0 ? primaryProfessions.join(' · ') : 'Actor',
        imageUrl,
        starmeterChange,
        knownFor,
        bio,
      });
    }

    return results;
  } catch {
    return [];
  }
}

function extractFromLdJson(html: string): LiveImdbPerson[] {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match?.[1]) return [];

  try {
    const data = JSON.parse(match[1]);
    const items = data?.itemListElement;
    if (!Array.isArray(items) || items.length === 0) return [];

    const results: LiveImdbPerson[] = [];
    for (let idx = 0; idx < Math.min(items.length, 100); idx++) {
      const entry = items[idx]?.item || items[idx];
      const name = entry?.name;
      if (!name) continue;

      results.push({
        id: idx + 1,
        rank: items[idx]?.position ?? idx + 1,
        name,
        profession: entry?.jobTitle || 'Actor',
        imageUrl: typeof entry?.image === 'string' ? entry.image : '',
        starmeterChange: 0,
        knownFor: [],
        bio: entry?.description || `${name} on IMDb Most Popular Celebs.`,
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchImdbStarmeter() {
  try {
    const response = await fetch('https://www.imdb.com/chart/starmeter/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      return { source: 'curated', status: response.status, updatedAt: new Date().toISOString(), people: [] };
    }

    const html = await response.text();
    let people = extractFromNextData(html);
    if (people.length === 0) {
      people = extractFromLdJson(html);
    }

    if (people.length > 0) {
      return {
        source: 'imdb-live',
        status: 200,
        updatedAt: new Date().toISOString(),
        people,
      };
    }

    return { source: 'curated', status: 200, updatedAt: new Date().toISOString(), people: [] };
  } catch {
    return { source: 'curated', status: 200, updatedAt: new Date().toISOString(), people: [] };
  }
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const payload = await fetchImdbStarmeter();
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
  res.end(JSON.stringify(payload));
}
