import { Middleware, RouterContext } from '@koa/router';
import { NotFound } from 'http-errors';
import { Next } from 'koa';
import createGetReviewedArticlesFromReviewReferences from './get-reviewed-articles-from-review-references';
import createRenderEndorsedArticles, { GetEndorsedArticles, RenderEndorsedArticles } from './render-endorsed-articles';
import createRenderPage, { FetchArticle } from './render-page';
import createRenderPageHeader, { GetEditorialCommunity, RenderPageHeader } from './render-page-header';
import createRenderReviewedArticles, { RenderReviewedArticles } from './render-reviewed-articles';
import createEndorsementsRepository from '../infrastructure/in-memory-endorsements-repository';
import { Adapters } from '../types/adapters';
import Doi from '../types/doi';
import EditorialCommunityRepository from '../types/editorial-community-repository';
import EndorsementsRepository from '../types/endorsements-repository';
import ReviewReferenceRepository from '../types/review-reference-repository';

const raiseFetchArticleErrors = (fetchArticle: Adapters['fetchArticle']): FetchArticle => (
  async (doi) => {
    const result = await fetchArticle(doi);
    return result.unsafelyUnwrap();
  }
);

const buildRenderPageHeader = (editorialCommunities: EditorialCommunityRepository): RenderPageHeader => {
  const getEditorialCommunity: GetEditorialCommunity = async (editorialCommunityId) => {
    const editorialCommunity = (await editorialCommunities.lookup(editorialCommunityId))
      .unwrapOrElse(() => {
        throw new NotFound(`${editorialCommunityId} not found`);
      });
    return editorialCommunity;
  };
  return createRenderPageHeader(getEditorialCommunity);
};

type GetArticleTitle = (doi: Doi) => Promise<string>;

const buildRenderEndorsedArticles = (
  endorsements: EndorsementsRepository,
  fetchArticle: FetchArticle,
): RenderEndorsedArticles => {
  const getArticleTitle: GetArticleTitle = async (articleDoi) => {
    const article = await fetchArticle(articleDoi);
    return article.title;
  };
  const getEndorsedArticles: GetEndorsedArticles = async (editorialCommunityId) => {
    const articleDois = await endorsements.endorsedBy(editorialCommunityId);
    return Promise.all(articleDois.map(async (articleDoi) => (
      {
        doi: articleDoi,
        title: await getArticleTitle(articleDoi),
      }
    )));
  };
  return createRenderEndorsedArticles(getEndorsedArticles);
};

const buildRenderReviewedArticles = (
  fetchArticle: FetchArticle,
  reviewReferenceRepository: ReviewReferenceRepository,
): RenderReviewedArticles => {
  const getReviewedArticles = createGetReviewedArticlesFromReviewReferences(
    reviewReferenceRepository.findReviewsForEditorialCommunityId,
    fetchArticle,
  );
  return createRenderReviewedArticles(getReviewedArticles);
};

// there should be a clean separation between:
// - knowledge of Koa
// - creation of page and its adapters
export default (adapters: Adapters): Middleware => {
  const fetchArticle = raiseFetchArticleErrors(adapters.fetchArticle);
  const renderPageHeader = buildRenderPageHeader(adapters.editorialCommunities);
  const renderEndorsedArticles = buildRenderEndorsedArticles(createEndorsementsRepository(), fetchArticle);
  const renderReviewedArticles = buildRenderReviewedArticles(fetchArticle, adapters.reviewReferenceRepository);

  const renderPage = createRenderPage(
    renderPageHeader,
    renderEndorsedArticles,
    renderReviewedArticles,
  );

  return async (ctx: RouterContext, next: Next): Promise<void> => {
    ctx.response.body = await renderPage(ctx.params.id);
    await next();
  };
};
