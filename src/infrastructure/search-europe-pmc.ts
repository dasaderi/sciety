import { URLSearchParams } from 'url';
import * as T from 'fp-ts/lib/Task';
import { Logger } from './logger';
import Doi from '../types/doi';
import { Json, JsonCompatible } from '../types/json';

export type GetJson = (uri: string) => Promise<Json>;

interface SearchResult {
  doi: Doi;
  title: string;
  authors: string;
  postedDate: Date;
}

export type SearchEuropePmc = (query: string) => T.Task<{
  items: Array<SearchResult>;
  total: number;
}>;

type EuropePmcQueryResponse = JsonCompatible<{
  hitCount: number;
  resultList: {
    result: Array<{
      doi: string;
      title: string;
      authorString: string;
      firstPublicationDate: string;
    }>;
  };
}>;

export default (getJson: GetJson, logger: Logger): SearchEuropePmc => (
  (query) => async () => {
    const queryString = new URLSearchParams({
      query: `${query} PUBLISHER:"bioRxiv" sort_date:y`,
      format: 'json',
      pageSize: '10',
    });

    const uri = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${queryString.toString()}`;
    let data: EuropePmcQueryResponse;

    try {
      data = await getJson(uri) as EuropePmcQueryResponse;
    } catch (error: unknown) {
      logger('error', 'Failed to search Europe PMC', { query, uri, error });

      throw error;
    }

    logger('debug', 'Received Europe PMC search results', { data });

    const items = data.resultList.result.map((item): SearchResult => ({
      doi: new Doi(item.doi),
      title: item.title,
      authors: item.authorString,
      postedDate: new Date(item.firstPublicationDate),
    }));

    return {
      items,
      total: data.hitCount,
    };
  }
);
