import { Middleware } from '@koa/router';
import { pipe } from 'fp-ts/lib/function';
import { NOT_FOUND, OK, SERVICE_UNAVAILABLE } from 'http-status-codes';
import { Maybe, Result } from 'true-myth';
import { renderErrorPage } from './render-error-page';
import applyStandardPageLayout, { Page } from '../shared-components/apply-standard-page-layout';
import { RenderPageError } from '../types/render-page-error';
import { User } from '../types/user';

type RenderedResult = Result<Page, RenderPageError>;

// TODO: find better way of handling params of different pages
type RenderPage = (params: {
  doi?: string;
  id?: string;
  query?: string;
  flavour?: string;
  user: Maybe<User>;
}) => Promise<RenderedResult>;

const successToStatusCode = (): number => OK;

const errorTypeToStatusCode = ({ type }: RenderPageError): number => (
  type === 'not-found' ? NOT_FOUND : SERVICE_UNAVAILABLE
);

type FoldToPage = (
  pageResult: RenderedResult,
) => Page;

const foldToPage: FoldToPage = (pageResult) => (
  pageResult.unwrapOrElse((error) => ({
    title: 'Error',
    content: renderErrorPage(error.message),
  }))
);

export default (
  renderPage: RenderPage,
): Middleware<{ user?: User }> => (
  async (context, next): Promise<void> => {
    const params = {
      ...context.params,
      ...context.query,
      ...context.state,
      user: Maybe.of(context.state.user),
    };
    context.response.type = 'html';

    const user = Maybe.of(context.state.user);

    const renderedResult = await renderPage(params);

    const addScietySuffixIfNotHomepage = (page: Page): Page => ({
      ...page,
      title: context.request.path === '/' ? page.title : `${page.title} | Sciety`,
    });

    context.response.body = pipe(
      renderedResult,
      foldToPage,
      addScietySuffixIfNotHomepage,
      (page) => applyStandardPageLayout(page, user),
    );

    context.response.status = renderedResult.map(successToStatusCode).unwrapOrElse(errorTypeToStatusCode);

    await next();
  }
);
