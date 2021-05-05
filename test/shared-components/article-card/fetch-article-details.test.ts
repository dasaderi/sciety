import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import { pipe } from 'fp-ts/function';
import { fetchArticleDetails } from '../../../src/shared-components/article-card/fetch-article-details';
import { Doi } from '../../../src/types/doi';
import { toHtmlFragment } from '../../../src/types/html-fragment';
import { sanitise } from '../../../src/types/sanitised-html-fragment';

const titleText = 'Accuracy of predicting chemical body composition of growing pigs using dual-energy X-ray absorptiometry';

const getArticle = () => TO.some({
  title: sanitise(toHtmlFragment(titleText)),
  server: 'biorxiv' as const,
  authors: ['Kasper C', 'Schlegel P', 'Ruiz-Ascacibar I', 'Stoll P', 'Bee G'],
});

describe('fetch-article-details', () => {
  describe('latest version date', () => {
    it('returns the latest version date for a doi', async () => {
      const doi = new Doi('10.1101/2020.09.15.286153');
      const latestDate = new Date('2020-12-14');
      const articleDetails = await pipe(
        doi,
        fetchArticleDetails(() => TO.some(latestDate), getArticle),
      )();

      expect(articleDetails).toStrictEqual(
        O.some(
          expect.objectContaining({
            latestVersionDate: O.some(latestDate),
          }),
        ),
      );
    });

    it.todo('returns an O.none for the latest version date when it fails');
  });

  describe('getArticleDetails', () => {
    it.todo('returns O.none when getArticleDetails fails');

    describe('title', () => {
      it('returns the title for a doi', async () => {
        const doi = new Doi('10.1101/2020.09.15.286153');
        const title = await pipe(
          doi,
          fetchArticleDetails(() => TO.some(new Date()), getArticle),
          TO.map((article) => article.title),
        )();
        const expected = pipe(
          titleText,
          toHtmlFragment,
          sanitise,
          O.some,
        );

        expect(title).toStrictEqual(expected);
      });
    });

    describe('authors', () => {
      it('returns the authors for a doi', async () => {
        const doi = new Doi('10.1101/2020.09.15.286153');
        const authors = await pipe(
          doi,
          fetchArticleDetails(() => TO.some(new Date()), getArticle),
          TO.map((article) => article.authors),
        )();
        const expected = pipe(
          ['Kasper C', 'Schlegel P', 'Ruiz-Ascacibar I', 'Stoll P', 'Bee G'],
          O.some,
        );

        expect(authors).toStrictEqual(expected);
      });
    });
  });
});
