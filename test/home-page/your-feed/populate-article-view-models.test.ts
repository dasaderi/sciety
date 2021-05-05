import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import { populateArticleViewModelsSkippingFailures } from '../../../src/home-page/your-feed/populate-article-view-models';
import { ArticleActivity } from '../../../src/types/article-activity';
import { Doi, eqDoi } from '../../../src/types/doi';
import { toHtmlFragment } from '../../../src/types/html-fragment';
import { sanitise } from '../../../src/types/sanitised-html-fragment';

describe('populate-article-view-models', () => {
  describe('no failures', () => {
    it('returns article view models by adding article metadata and version dates', async () => {
      const activities: ReadonlyArray<ArticleActivity> = [
        {
          doi: new Doi('10.1101/11111'),
          evaluationCount: 1,
          latestActivityDate: new Date(),
        },
        {
          doi: new Doi('10.1101/22222'),
          evaluationCount: 1,
          latestActivityDate: new Date(),
        },
      ];
      const fetchArticleDetails = (doi: Doi) => TO.of({
        title: sanitise(toHtmlFragment('')),
        authors: [],
        // eslint-disable-next-line jest/no-if
        latestVersionDate: eqDoi.equals(doi, new Doi('10.1101/11111'))
          ? O.some(new Date('2021-01-01'))
          : O.some(new Date('1921-01-01')),
      });
      const results = await populateArticleViewModelsSkippingFailures(fetchArticleDetails)(activities)();

      expect(results).toHaveLength(2);
      expect(results[0]).toStrictEqual(expect.objectContaining({ latestVersionDate: O.some(new Date('2021-01-01')) }));
      expect(results[1]).toStrictEqual(expect.objectContaining({ latestVersionDate: O.some(new Date('1921-01-01')) }));
    });
  });

  describe('version date failing', () => {
    it('returns an article view model without a version date', async () => {
      const activities: ReadonlyArray<ArticleActivity> = [
        {
          doi: new Doi('10.1101/11111'),
          evaluationCount: 1,
          latestActivityDate: new Date(),
        },
      ];
      const fetchArticleDetails = () => TO.of({
        title: sanitise(toHtmlFragment('')),
        authors: [],
        latestVersionDate: O.none,
      });
      const results = await populateArticleViewModelsSkippingFailures(fetchArticleDetails)(activities)();

      expect(results).toStrictEqual([
        expect.objectContaining({
          latestVersionDate: O.none,
        }),
      ]);
    });
  });

  describe('only one of two articles failing, on article title and authors', () => {
    it.todo('only returns view models for the not failing articles');

    it.todo('does not return an article view model for the failing article');
  });

  describe('all articles failing', () => {
    // We're having trouble accessing this content right now. Please try again later.
    it.todo('display error message');
  });
});
