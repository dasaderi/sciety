import { Maybe } from 'true-myth';
import { toDisplayString, toString } from '../templates/date';
import templateListItems from '../templates/list-items';
import Doi from '../types/doi';

type RenderRecentActivity = (limit: number) => Promise<string>;

export interface RecentReview {
  articleDoi: Doi;
  articleTitle: Maybe<string>;
  editorialCommunityId: string;
  editorialCommunityName: string;
  added: Date;
}

export interface ReviewReference {
  articleVersionDoi: Doi;
  editorialCommunityId: string;
  added: Date;
}

export interface FetchedArticle {
  title: string;
  doi: Doi;
}

export interface EditorialCommunity {
  id: string;
  name: string;
}

export type GetReviewReferences = () => Promise<Array<ReviewReference>>;
export type FetchArticle = (doi: Doi) => Promise<Maybe<FetchedArticle>>;
export type GetEditorialCommunities = () => Promise<Array<EditorialCommunity>>;

export const createDiscoverRecentActivity = (
  reviewReferences: GetReviewReferences,
  fetchArticle: FetchArticle,
  editorialCommunities: GetEditorialCommunities,
) => (
  async (limit: number): Promise<Array<RecentReview>> => {
    const editorialCommunityNames: Record<string, string> = (await editorialCommunities())
      .reduce((accumulator, editorialCommunity) => ({
        ...accumulator,
        [editorialCommunity.id]: editorialCommunity.name,
      }), {});

    const mostRecentReviews = (await reviewReferences())
      .sort((a, b) => b.added.getTime() - a.added.getTime())
      .slice(0, limit)
      .map(async (reviewReference) => {
        const article = await fetchArticle(reviewReference.articleVersionDoi);
        return {
          articleDoi: reviewReference.articleVersionDoi,
          articleTitle: article.map((a) => a.title),
          editorialCommunityId: reviewReference.editorialCommunityId,
          editorialCommunityName: editorialCommunityNames[reviewReference.editorialCommunityId],
          added: reviewReference.added,
        };
      });

    return Promise.all(mostRecentReviews);
  }
);

const templateRecentReview = (review: RecentReview): string => {
  if (review.articleTitle.isNothing()) {
    return '';
  }
  return `
    <div class="content">
      <div class="summary">
        <a href="/articles/${review.articleDoi}">${review.articleTitle}</a>
        reviewed by <a href="/editorial-communities/${review.editorialCommunityId}">${review.editorialCommunityName}</a>
        <time datetime="${toString(review.added)}" title="${toDisplayString(review.added)}" class="date">recently</time>
      </div>
    </div>
  `;
};

const templateMostRecentReviews = (reviews: Array<RecentReview>): string => (`
  <section>

    <h2 class="ui header">
      Recent activity
    </h2>

    <ol class="ui large feed">
      ${templateListItems(reviews.map(templateRecentReview), 'event')}
    </ol>

  </section>
`);

export default (
  reviewReferences: GetReviewReferences,
  fetchArticle: FetchArticle,
  editorialCommunities: GetEditorialCommunities,
): RenderRecentActivity => {
  const discoverMostRecentReviews = createDiscoverRecentActivity(
    reviewReferences,
    fetchArticle,
    editorialCommunities,
  );

  return async (limit) => templateMostRecentReviews(await discoverMostRecentReviews(limit));
};
