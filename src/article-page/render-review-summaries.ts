import renderReviewSummary from './render-review-summary';
import Doi from '../data/doi';
import templateListItems from '../templates/list-items';

export type GetArticleReviewSummaries = () => Promise<Array<{
  publicationDate: Date;
  summary: string;
  doi: Doi;
  editorialCommunityId: string;
  editorialCommunityName: string;
}>>;

export default (reviews: GetArticleReviewSummaries) => async (): Promise<string> => {
  const reviewSummaries = (await reviews()).map((review, index) => renderReviewSummary(review, `review-${index}`));
  return `
    <h2 class="ui header">
      Review summaries
    </h2>
    <ol class="ui very relaxed divided items">
      ${templateListItems(reviewSummaries)}
    </ol>
  `;
};
