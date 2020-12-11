import * as E from 'fp-ts/lib/Either';
import * as T from 'fp-ts/lib/Task';
import { identity, pipe } from 'fp-ts/lib/function';
import templateDate from '../shared-components/date';
import Doi from '../types/doi';
import { HtmlFragment, toHtmlFragment } from '../types/html-fragment';

export interface SearchResult {
  doi: Doi;
  title: string;
  authors: string;
  postedDate: Date;
}

export type GetReviewCount = (doi: Doi) => T.Task<number>;

export type RenderSearchResult = (result: SearchResult) => Promise<HtmlFragment>;

const createRenderReviews = (
  getReviewCount: GetReviewCount,
) => (
  async (doi: Doi): Promise<HtmlFragment> => (
    pipe(
      doi,
      getReviewCount,
      T.map(E.fromPredicate((reviewCount) => reviewCount > 0, () => '')),
      T.map(E.fold(identity, (reviewCount) => `
        <div class="ui label">
          Reviews
          <span class="detail">${reviewCount}</span>
        </div>
      `)),
      T.map(toHtmlFragment),
    )()
  )
);

const templatePostedDate = (date: Date): HtmlFragment => toHtmlFragment(
  `<div class="meta">Posted ${templateDate(date)}</div>`,
);

export default (
  getReviewCount: GetReviewCount,
): RenderSearchResult => {
  const renderReviews = createRenderReviews(getReviewCount);

  return async (result) => toHtmlFragment(`
    <div class="content">
      <a class="header" href="/articles/${result.doi.value}">${result.title}</a>
      <div class="meta">
        ${result.authors}
      </div>
      ${templatePostedDate(result.postedDate)}
      <div class="extra">
        ${await renderReviews(result.doi)}
      </div>
    </div>
  `);
};
