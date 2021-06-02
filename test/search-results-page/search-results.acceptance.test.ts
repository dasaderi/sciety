import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as TO from 'fp-ts/TaskOption';
import { pipe } from 'fp-ts/function';
import { JSDOM } from 'jsdom';
import { searchResultsPage } from '../../src/search-results-page';
import { toHtmlFragment } from '../../src/types/html-fragment';
import { Page } from '../../src/types/page';
import { RenderPageError } from '../../src/types/render-page-error';
import { sanitise } from '../../src/types/sanitised-html-fragment';
import {
  arbitraryDate, arbitraryNumber, arbitraryString, arbitraryWord,
} from '../helpers';
import { shouldNotBeCalled } from '../should-not-be-called';
import { arbitraryDoi } from '../types/doi.helper';
import { arbitraryGroupId } from '../types/group-id.helper';
import { arbitraryGroup } from '../types/group.helper';

const dummyAdapters = {
  findGroups: shouldNotBeCalled,
  searchEuropePmc: shouldNotBeCalled,
  findReviewsForArticleDoi: shouldNotBeCalled,
  findVersionsForArticleDoi: shouldNotBeCalled,
  getAllEvents: shouldNotBeCalled,
  getGroup: () => shouldNotBeCalled,
};

const contentOf = (page: TE.TaskEither<RenderPageError, Page>) => pipe(
  page,
  TE.match(
    (errorPage) => errorPage.message,
    (p) => p.content,
  ),
  T.map(JSDOM.fragment),
);

describe('search-results-page acceptance', () => {
  describe('given a query', () => {
    const query = arbitraryString();
    const params = {
      query,
      pageSize: arbitraryNumber(5, 10),
      category: O.none,
      cursor: O.none,
    };

    it('displays the query inside the search form', async () => {
      const page = pipe(
        params,
        searchResultsPage({
          ...dummyAdapters,
          findGroups: () => T.of([]),
          searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
        }),
      );
      const rendered = await contentOf(page)();
      const value = rendered.querySelector('#searchText')?.getAttribute('value');

      expect(value).toBe(query);
    });

    it('displays the number of matching articles', async () => {
      const page = pipe(
        params,
        searchResultsPage({
          ...dummyAdapters,
          findGroups: () => T.of([]),
          searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
        }),
      );
      const rendered = await contentOf(page)();
      const tabHtml = rendered.querySelector('.search-results-tab--heading')?.innerHTML;

      expect(tabHtml).toContain('Articles (0');
    });

    it('displays the number of matching groups', async () => {
      const page = pipe(
        params,
        searchResultsPage({
          ...dummyAdapters,
          findGroups: () => T.of([]),
          searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
        }),
      );
      const rendered = await contentOf(page)();
      const tabHtml = rendered.querySelector('.search-results-tab--link')?.innerHTML;

      expect(tabHtml).toContain('Groups (0');
    });

    describe('with no category provided', () => {
      it('defaults to "articles" category', async () => {
        const page = pipe(
          {
            query: arbitraryString(),
            pageSize: arbitraryNumber(5, 10),
            category: O.none,
            cursor: O.none,
          },
          searchResultsPage({
            ...dummyAdapters,
            findGroups: () => T.of([]),
            searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
          }),
        );
        const rendered = await contentOf(page)();
        const tabHeading = rendered.querySelector('.search-results-tab--heading')?.innerHTML;

        expect(tabHeading).toContain('Articles');
      });
    });

    describe('when there are results', () => {
      describe('with "articles" as category', () => {
        const arbitraryArticleItem = () => ({
          doi: arbitraryDoi(),
          server: 'biorxiv' as const,
          title: pipe(arbitraryString(), toHtmlFragment, sanitise),
          authors: [arbitraryString()],
          postedDate: arbitraryDate(),
        });

        it.todo('when there are fewer than n article results displays all');

        it('displays the first n articles if more than n matching articles', async () => {
          const n = 2;
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: n,
              category: O.some('articles' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([]),
              searchEuropePmc: () => () => TE.right({
                items: [
                  arbitraryArticleItem(),
                  arbitraryArticleItem(),
                  arbitraryArticleItem(),
                ],
                total: 3,
                nextCursor: O.some(arbitraryWord()),
              }),
              findReviewsForArticleDoi: () => T.of([]),
              findVersionsForArticleDoi: () => TO.none,
            }),
          );
          const rendered = await contentOf(page)();
          const articleCards = rendered.querySelectorAll('.article-card');

          expect(articleCards).toHaveLength(n);
        });

        it.skip('displays the next link if there are more than n matching articles', async () => {
          const n = 2;
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: n,
              category: O.some('articles' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([]),
              searchEuropePmc: () => () => TE.right({
                items: [
                  arbitraryArticleItem(),
                  arbitraryArticleItem(),
                  arbitraryArticleItem(),
                ],
                total: 3,
                nextCursor: O.some(arbitraryWord()),
              }),
              findReviewsForArticleDoi: () => T.of([]),
              findVersionsForArticleDoi: () => TO.none,
            }),
          );
          const rendered = await contentOf(page)();
          const nextLink = rendered.querySelector('.search-results__next_link');

          expect(nextLink).not.toBeNull();
        });

        it('passes the cursor to searchEuropePmc', async () => {
          const n = 2;
          const searchEuropePmcMock = jest.fn();
          const cursor = O.some(arbitraryString());
          const page = pipe(
            {
              query,
              pageSize: n,
              category: O.some('articles' as const),
              cursor,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([]),
              searchEuropePmc: () => searchEuropePmcMock.mockImplementation(() => TE.right({
                items: [
                  arbitraryArticleItem(),
                ],
                total: 3,
              })),
              findReviewsForArticleDoi: () => T.of([]),
              findVersionsForArticleDoi: () => TO.none,
            }),
          );
          await contentOf(page)();

          expect(searchEuropePmcMock).toHaveBeenCalledWith(query, cursor);
        });

        it('only displays article results', async () => {
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: arbitraryNumber(5, 10),
              category: O.some('articles' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([arbitraryGroupId()]),
              searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
            }),
          );
          const rendered = await contentOf(page)();
          const groupCards = rendered.querySelectorAll('.group-card');

          expect(groupCards).toHaveLength(0);
        });

        it('displays "Articles" as the active tab', async () => {
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: arbitraryNumber(5, 10),
              category: O.some('articles' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([arbitraryGroupId()]),
              searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
            }),
          );
          const rendered = await contentOf(page)();
          const tabHtml = rendered.querySelector('.search-results-tab--heading')?.innerHTML;

          expect(tabHtml).toContain('Articles');
        });

        it('displays "Groups" as a link tab', async () => {
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: arbitraryNumber(5, 10),
              category: O.some('articles' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([arbitraryGroupId()]),
              searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
            }),
          );
          const rendered = await contentOf(page)();
          const tabHtml = rendered.querySelector('.search-results-tab--link')?.innerHTML;

          expect(tabHtml).toContain('Groups');
        });

        describe('when extra details of an article cannot be fetched', () => {
          it.todo('display the article without extra details');
        });

        describe('when the search for all articles fails', () => {
          it.todo('display an error message');
        });
      });

      describe('with "groups" as category', () => {
        it('displays all matching groups regardless of limit on articles', async () => {
          const n = 2;
          const matchedGroups = [
            arbitraryGroupId(),
            arbitraryGroupId(),
            arbitraryGroupId(),
          ];
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: n,
              category: O.some('groups' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of(matchedGroups),
              searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
              getGroup: () => TO.some(arbitraryGroup()),
              getAllEvents: T.of([]),
            }),
          );
          const rendered = await contentOf(page)();
          const groupCards = rendered.querySelectorAll('.group-card');

          expect(groupCards).toHaveLength(matchedGroups.length);
        });

        it.todo('only displays groups results');

        it.todo('displays "Groups" as the active tab');

        it.todo('displays "Articles" as a link tab');

        describe('when details of a group cannot be fetched', () => {
          it.todo('only displays the successfully fetched groups');
        });

        describe('when details of all groups cannot be fetched', () => {
          it.todo('display no result cards');
        });
      });
    });

    describe('when there are no results', () => {
      describe('with "articles" as category', () => {
        it('displays no result cards', async () => {
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: arbitraryNumber(5, 20),
              category: O.some('groups' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([]),
              searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
            }),
          );
          const rendered = await contentOf(page)();
          const articleCards = rendered.querySelectorAll('.article-card');

          expect(articleCards).toHaveLength(0);
        });
      });

      describe('with "groups" as category', () => {
        it('displays no result cards', async () => {
          const page = pipe(
            {
              query: arbitraryString(),
              pageSize: arbitraryNumber(5, 20),
              category: O.some('groups' as const),
              cursor: O.none,
            },
            searchResultsPage({
              ...dummyAdapters,
              findGroups: () => T.of([]),
              searchEuropePmc: () => () => TE.right({ items: [], total: 0, nextCursor: O.some(arbitraryWord()) }),
            }),
          );
          const rendered = await contentOf(page)();
          const groupCards = rendered.querySelectorAll('.group-card');

          expect(groupCards).toHaveLength(0);
        });
      });
    });
  });
});
