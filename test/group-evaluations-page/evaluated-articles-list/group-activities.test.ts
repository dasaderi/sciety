/* eslint-disable jest/expect-expect */
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import {
  evaluatedArticles,
  GroupActivities,
  paginate,
} from '../../../src/group-evaluations-page/evaluated-articles-list/group-activities';
import { ArticleActivity } from '../../../src/types/article-activity';
import * as DE from '../../../src/types/data-error';
import {
  editorialCommunityReviewedArticle,
} from '../../../src/types/domain-events';
import { arbitraryDate, arbitraryNumber } from '../../helpers';
import { arbitraryDoi } from '../../types/doi.helper';
import { arbitraryGroupId } from '../../types/group-id.helper';
import { arbitraryReviewId } from '../../types/review-id.helper';

const expectContentOf = (activities: GroupActivities, expectedContent: unknown) => (
  expect(activities).toStrictEqual(E.right(expect.objectContaining({
    content: expectedContent,
  })))
);

describe('evaluated-articles', () => {
  describe('when only a single group has evaluated an article once', () => {
    const articleId = arbitraryDoi();
    const groupId = arbitraryGroupId();
    const date = arbitraryDate();
    const events = [
      editorialCommunityReviewedArticle(
        groupId,
        articleId,
        arbitraryReviewId(),
        date,
      ),
    ];

    it('includes the article DOI', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          doi: articleId,
        }),
      ]);
    });

    it('has an evaluation count of 1', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          evaluationCount: 1,
        }),
      ]);
    });

    it('latest activity date matches event date', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          latestActivityDate: date,
        }),
      ]);
    });
  });

  describe('when only a single group has evaluated an article more than once', () => {
    const groupId = arbitraryGroupId();
    const articleId = arbitraryDoi();
    const latestActivityDate = new Date('2020-01-01');
    const events = [
      editorialCommunityReviewedArticle(
        groupId,
        articleId,
        arbitraryReviewId(),
        new Date('1980-01-01'),
      ),
      editorialCommunityReviewedArticle(
        groupId,
        articleId,
        arbitraryReviewId(),
        latestActivityDate,
      ),
    ];

    it('has a single entry for the article', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          doi: articleId,
        }),
      ]);
    });

    it('has an evaluation count of the number of evaluations', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          evaluationCount: 2,
        }),
      ]);
    });

    it('has a latest activity date of the latest evaluation', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          latestActivityDate,
        }),
      ]);
    });
  });

  describe('when multiple groups have evaluated an article', () => {
    const groupId = arbitraryGroupId();
    const otherGroupId = arbitraryGroupId();
    const articleId = arbitraryDoi();
    const mostRecentActivityDate = new Date('2021-03-10T00:00:00.000Z');
    const events = [
      editorialCommunityReviewedArticle(
        groupId,
        articleId,
        arbitraryReviewId(),
        new Date('2020-10-14T00:00:00.000Z'),
      ),
      editorialCommunityReviewedArticle(
        otherGroupId,
        articleId,
        arbitraryReviewId(),
        mostRecentActivityDate,
      ),
      editorialCommunityReviewedArticle(
        otherGroupId,
        articleId,
        arbitraryReviewId(),
        mostRecentActivityDate,
      ),
      editorialCommunityReviewedArticle(
        otherGroupId,
        articleId,
        arbitraryReviewId(),
        mostRecentActivityDate,
      ),
    ];

    it('has an evaluation count of the number of evaluations by all groups', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          doi: articleId,
          evaluationCount: 4,
        }),
      ]);
    });

    it('has a latest activity date of the latest evaluation by any group', () => {
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          latestActivityDate: mostRecentActivityDate,
        }),
      ]);
    });
  });

  describe('when the group has evaluated multiple articles', () => {
    const groupId = arbitraryGroupId();

    it('returns the most recently evaluated articles first', () => {
      const earlierDate = new Date('2019-09-06T00:00:00.000Z');
      const laterDate = new Date('2019-12-05T00:00:00.000Z');
      const events = [
        editorialCommunityReviewedArticle(
          groupId,
          arbitraryDoi(),
          arbitraryReviewId(),
          earlierDate,
        ),
        editorialCommunityReviewedArticle(
          groupId,
          arbitraryDoi(),
          arbitraryReviewId(),
          laterDate,
        ),
      ];
      const activities = evaluatedArticles(groupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          latestActivityDate: laterDate,
        }),
        expect.objectContaining({
          latestActivityDate: earlierDate,
        }),
      ]);
    });
  });

  describe('when another group evaluates an article previously evaluated by this group', () => {
    it('orders by the evaluation date of this group', () => {
      const thisGroupId = arbitraryGroupId();
      const anotherGroupId = arbitraryGroupId();
      const articleMostRecentlyReviewedByThisGroup = arbitraryDoi();
      const articleThatWasMoreRecentlyReviewedButByAnotherGroup = arbitraryDoi();
      const events = [
        editorialCommunityReviewedArticle(
          thisGroupId,
          articleThatWasMoreRecentlyReviewedButByAnotherGroup,
          arbitraryReviewId(),
          new Date('1980-01-01'),
        ),
        editorialCommunityReviewedArticle(
          thisGroupId,
          articleMostRecentlyReviewedByThisGroup,
          arbitraryReviewId(),
          new Date('2000-01-01'),
        ),
        editorialCommunityReviewedArticle(
          anotherGroupId,
          articleThatWasMoreRecentlyReviewedButByAnotherGroup,
          arbitraryReviewId(),
          new Date('2020-01-01'),
        ),
      ];

      const activities = evaluatedArticles(thisGroupId)(events);

      expect(activities).toStrictEqual([
        expect.objectContaining({
          doi: articleMostRecentlyReviewedByThisGroup,
        }),
        expect.objectContaining({
          doi: articleThatWasMoreRecentlyReviewedButByAnotherGroup,
        }),
      ]);
    });
  });

  describe('when the group has not evaluated any articles', () => {
    it('returns an empty list', () => {
      const thisGroupId = arbitraryGroupId();
      const anotherGroupId = arbitraryGroupId();
      const events = [
        editorialCommunityReviewedArticle(
          anotherGroupId,
          arbitraryDoi(),
          arbitraryReviewId(),
          arbitraryDate(),
        ),
      ];

      const activities = evaluatedArticles(thisGroupId)(events);

      expect(activities).toStrictEqual([]);
    });
  });
});

describe('paginate', () => {
  const pageSize = arbitraryNumber(3, 10);

  const generateNArticles = (
    numberOfArticles: number,
  ): ReadonlyArray<ArticleActivity> => (
    [...Array(numberOfArticles).keys()].map(() => ({
      doi: arbitraryDoi(),
      latestActivityDate: arbitraryDate(),
      evaluationCount: arbitraryNumber(1, 5),
    })));

  describe('when the group has evaluated multiple articles', () => {
    it('limits the number of entries to the requested page size', () => {
      const articleActivities = generateNArticles(pageSize + 3);
      const activities = paginate(1, pageSize)(articleActivities);

      expect(pipe(
        activities,
        E.map((a) => a.content.length),
      )).toStrictEqual(E.right(pageSize));
    });

    it('returns the specified page of the list', () => {
      const earlierDate = new Date('2019-09-06T00:00:00.000Z');
      const laterDate = new Date('2019-12-05T00:00:00.000Z');
      const articleActivities = [
        {
          doi: arbitraryDoi(),
          latestActivityDate: laterDate,
          evaluationCount: arbitraryNumber(1, 5),
        },
        {
          doi: arbitraryDoi(),
          latestActivityDate: earlierDate,
          evaluationCount: arbitraryNumber(1, 5),
        },
      ];
      const activities = paginate(2, 1)(articleActivities);

      expectContentOf(activities, [
        expect.objectContaining({
          latestActivityDate: earlierDate,
        }),
      ]);
    });

    it.each([
      [9, 1, O.none],
      [11, 1, O.some(2)],
      [20, 1, O.some(2)],
      [20, 2, O.none],
      [21, 2, O.some(3)],
      [21, 3, O.none],
    ])('given %d events and a request for page %d, returns the next page', (numberOfEvents, page, expected) => {
      const articles = generateNArticles(numberOfEvents);
      const activities = paginate(page, 10)(articles);

      expect(activities).toStrictEqual(E.right(expect.objectContaining({
        nextPageNumber: expected,
      })));
    });

    it('returns not-found when asked for a page that does not exist', () => {
      const articles = generateNArticles(1);
      const activities = paginate(2, 10)(articles);

      expect(activities).toStrictEqual(E.left(DE.notFound));
    });

    it('returns an empty page 1 when there are no events', () => {
      const activities = paginate(arbitraryNumber(1, 20), 10)([]);

      expectContentOf(activities, []);
    });
  });
});
