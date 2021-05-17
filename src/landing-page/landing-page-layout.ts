import * as O from 'fp-ts/Option';
import {
  cookieConsent, googleTagManager, googleTagManagerNoScript,
} from '../shared-components/analytics';
import { head } from '../shared-components/head';
import { siteMenuItems } from '../shared-components/site-menu';
import { utilityBar } from '../shared-components/utility-bar';
import { Page } from '../types/page';
import { User } from '../types/user';

// TODO: return a more specific type e.g. HtmlDocument
export const landingPageLayout = (user: O.Option<User>) => (page: Page): string => `<!doctype html>
<html lang="en" prefix="og: http://ogp.me/ns#">
  ${head(page.title, page.openGraph)}
<body>
  ${googleTagManagerNoScript()}
  <div class="page-container">
    <nav class="drawer">
      <a href="/" class="drawer__logo_link" aria-hidden="true">
        <img src="/static/images/sciety-logo-white-text.svg " alt="Sciety" class="drawer__logo">
      </a>

      ${siteMenuItems(user)}

    </nav>
    <header class="site-header">
      <div class="site-header__inner">
        <a href="/menu" class="site-header__menu_link">
          <img src="/static/images/menu-icon.svg" alt="" />
        </a>

        ${utilityBar(user)}
      </div>
    </header>

    <main class="page-content">
      ${page.content}
    </main>

    <footer class="landing-page-footer">
      <ul class="landing-page-footer__links" role="list">
        <li class="landing-page-footer__link"><a href="/about">About</a></li>
        <li class="landing-page-footer__link"><a href="/feedback">Feedback</a></li>
        <li class="landing-page-footer__link"><a href="/blog">Blog</a></li>
      </ul>
      <small>
        © 2021 eLife Sciences Publications Ltd.
        <a href="/legal">Legal information</a>
      </small>
    </footer>
  </div>

  <script src="/static/behaviour.js"></script>

  ${googleTagManager()}
  ${cookieConsent()}
</body>
</html>
`;
