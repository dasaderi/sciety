import { pipe } from 'fp-ts/function';
import { selectSubsetToDisplay } from '../../src/search-results-page/select-subset-to-display';
import { Doi } from '../../src/types/doi';
import { toHtmlFragment } from '../../src/types/html-fragment';
import { sanitise } from '../../src/types/sanitised-html-fragment';
import { arbitraryGroupId } from '../types/group-id.helper';

describe('select-subset-to-display', () => {
  describe('prioritizing groups over articles', () => {
    it('returns 2 groups and 0 articles when given a limit of 2, and 2 of each', () => {
      const group1 = {
        _tag: 'Group' as const,
        id: arbitraryGroupId(),
      };
      const group2 = {
        _tag: 'Group' as const,
        id: arbitraryGroupId(),
      };
      const article = {
        _tag: 'Article' as const,
        doi: new Doi('10.1101/1234'),
        server: 'biorxiv' as const,
        title: pipe('', toHtmlFragment, sanitise),
        authors: [''],
        postedDate: new Date(),
      };
      const state = {
        query: '',
        groups: [group1, group2],
        articles: {
          items: [article, article],
          total: 2,
        },
      };
      const result = selectSubsetToDisplay(2)(state);

      expect(result.itemsToDisplay).toStrictEqual([group1, group2]);
    });
  });

  describe('length limit', () => {

  });

  describe('total calculation', () => {

  });

  describe('maintaining order of results', () => {

  });
});
