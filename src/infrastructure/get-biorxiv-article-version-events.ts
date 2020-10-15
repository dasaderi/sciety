import { URL } from 'url';
import { Logger } from './logger';
import Doi from '../types/doi';
import { Json, JsonCompatible } from '../types/json';

export type GetJson = (url: string) => Promise<Json>;

type BiorxivResponse = JsonCompatible<{
  collection: ReadonlyArray<{
    date: string;
    version: string;
  }>
}>;

export type GetBiorxivArticleVersionEvents = (doi: Doi) => Promise<ReadonlyArray<{
  source: URL;
  occurredAt: Date;
  version: number;
}>>;

export default (
  getJson: GetJson,
  logger: Logger,
): GetBiorxivArticleVersionEvents => (
  async (doi) => {
    const url = `https://api.biorxiv.org/details/biorxiv/${doi.value}`;
    logger('debug', 'Fetching article versions from biorxiv', { url });

    try {
      const biorxivResponse = await getJson(url) as BiorxivResponse;

      logger('debug', 'Retrieved article versions', { biorxivResponse });

      return biorxivResponse.collection.map((articleDetail) => ({
        source: new URL(`https://www.biorxiv.org/content/${doi.value}v${articleDetail.version}`),
        occurredAt: new Date(articleDetail.date),
        version: Number.parseInt(articleDetail.version, 10),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      logger('error', 'Failed to retrieve article versions', { doi, error, message });
      return [];
    }
  }
);
