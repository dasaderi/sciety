import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import buildRenderPage from '../../src/article-search-page';
import { createTestServer } from '../http/server';

describe('create render page', (): void => {
  it('displays search results', async (): Promise<void> => {
    const { adapters } = await createTestServer();
    const renderPage = buildRenderPage(adapters);
    const params = { query: '10.1101/833392' };

    const content = await pipe(
      renderPage(params),
      TE.map((page) => page.content),
    )();

    expect(content).toStrictEqual(E.right(expect.stringContaining('Search results')));
  });
});
