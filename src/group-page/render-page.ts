import { pipe } from 'fp-ts/function';
import { Group } from '../types/group';
import { HtmlFragment, toHtmlFragment } from '../types/html-fragment';
import { Page } from '../types/page';
import { RenderPageError } from '../types/render-page-error';

// TODO: recentActivity should be HtmlFragment
type Components = {
  header: HtmlFragment,
  description: HtmlFragment,
  recentActivity: string,
  followers: HtmlFragment,
  followButton: HtmlFragment,
};

const render = (components: Components) => `
  <div class="page-content__background">
    <div class="sciety-grid sciety-grid--group">
      ${components.header}
      <div class="group-page-description">
      ${components.description}
      </div>
      <div class="group-page-side-bar">
        ${components.followers}
        <section>
          <h2>
            Recent Activity
          </h2>
          <div class="group-page-side-bar--follow-toggle">
            ${components.followButton}
          </div>
          ${components.recentActivity}
        </section>
      </div>
    </div>
  </div>
`;

export const renderErrorPage = (): RenderPageError => ({
  type: 'unavailable' as const,
  message: toHtmlFragment('We couldn\'t retrieve this information. Please try again.'),
});

export const renderPage = (group: Group) => (components: Components): Page => ({
  title: group.name,
  content: pipe(components, render, toHtmlFragment),
});
