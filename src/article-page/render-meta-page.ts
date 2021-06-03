import { ArticleServer } from '../types/article-server';
import { Doi } from '../types/doi';
import { HtmlFragment, toHtmlFragment } from '../types/html-fragment';

// TODO: title should be HtmlFragment and sanitized outside of here
type ArticleDetails = {
  title: string,
  abstract: HtmlFragment,
  authors: ReadonlyArray<string>,
  server: ArticleServer,
};

// TODO: replace string with HtmlFragment
export const renderMetaPage = (components: {
  articleDetails: ArticleDetails,
  doi: Doi,
  saveArticle: string,
  tweetThis: string,
}): HtmlFragment => toHtmlFragment(`
<div class="page-content__background">
  <article class="sciety-grid sciety-grid--article">
    <header class="page-header page-header--article">
      <h1 class="page-header__title">${components.articleDetails.title}</h1>
      <div class="article-actions">
        ${components.tweetThis}
        ${components.saveArticle}
      </div>
    </header>

    <div class="article-tabs-container">
      <h2 class="article-tab article-tab--heading">Article</h2>
      <a class="article-tab article-tab--link" href="/articles/activity/${components.doi.value}" aria-label="Discover article activity">Activity</a>
    </div>

    <div class="main-content main-content--meta">
      <section class="article-meta">
        <ol aria-label="Authors of this article" class="article-author-list" role="list">
          ${components.articleDetails.authors.map((author) => `<li>${author}</li>`).join('')}
        </ol>
        <ul aria-label="Publication details" class="article-meta-data-list" role="list">
          <li>
            <a href="https://doi.org/${components.doi.value}" target="_blank">https://doi.org/${components.doi.value}</a>
          </li>
        </ul>
      </section>

      <section class="article-abstract" role="doc-abstract">
        ${components.articleDetails.abstract}
      </section>

      <a href="https://doi.org/${components.doi.value}" class="full-article-button" target="_blank">
        Read the full article
      </a>
    </div>

  </article>
</div>
    `);
