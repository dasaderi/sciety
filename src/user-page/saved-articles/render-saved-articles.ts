import * as O from 'fp-ts/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray';
import { flow } from 'fp-ts/function';
import { renderArticleCard } from '../../shared-components/article-card';
import { templateListItems } from '../../shared-components/list-items';
import { toHtmlFragment } from '../../types/html-fragment';

export const renderSavedArticles = flow(
  RA.map(renderArticleCard),
  RNEA.fromReadonlyArray,
  O.map((items) => templateListItems(items, 'saved-articles__item')),
  O.fold(
    () => `
      <p class="saved-articles__no_articles">
      This user has no saved articles.
      </p>
    `,
    (list) => `
      <ol class="saved-articles" role="list">
        ${list}
      </ol>
    `,
  ),
  (html) => `
      <section id="saved-articles">
        ${html}
      </section>
  `,
  toHtmlFragment,
);
