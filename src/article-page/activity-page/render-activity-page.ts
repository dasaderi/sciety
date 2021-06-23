import { tabs } from '../../shared-components/tabs';
import { Doi } from '../../types/doi';
import { HtmlFragment, toHtmlFragment } from '../../types/html-fragment';

// TODO: title should be HtmlFragment and sanitized outside of here
type ArticleDetails = {
  title: string,
};

// TODO: replace string with HtmlFragment
export const renderActivityPage = (components: {
  articleDetails: ArticleDetails,
  doi: Doi,
  feed: string,
  saveArticle: string,
  tweetThis: string,
}): HtmlFragment => toHtmlFragment(`
  <div class="page-content__background">
    <article class="sciety-grid sciety-grid--article">
      <header class="page-header page-header--article">
        <h1 class="page-header__title" >${components.articleDetails.title}</h1>
        <div class="article-actions">
          ${components.tweetThis}
          ${components.saveArticle}
        </div>
      </header>
        
      <div class="main-content">
        ${tabs(
    [
      {
        label: '<span class="visually-hidden">Discover information and abstract about this </span>Article',
        url: `/articles/meta/${components.doi.value}`,
      },
      {
        label: 'Activity',
        url: `/articles/activity/${components.doi.value}`,
      },
    ],
  )(toHtmlFragment(components.feed), 1)}
      </div>
    </article>
  </div>
`);
