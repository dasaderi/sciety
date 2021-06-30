import { sequenceS } from 'fp-ts/Apply';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { flow, pipe } from 'fp-ts/function';
import { GetAllEvents, projectSavedArticleDois } from './project-saved-article-dois';
import { savedArticles, Ports as SavedArticlesPorts } from './saved-articles';
import { tabs } from '../../shared-components/tabs';
import * as DE from '../../types/data-error';
import { toHtmlFragment } from '../../types/html-fragment';
import { Page } from '../../types/page';
import { RenderPageError } from '../../types/render-page-error';
import { UserId } from '../../types/user-id';
import { followedGroupIds } from '../followed-groups-page/project-followed-group-ids';
import { renderErrorPage } from '../render-error-page';
import { renderHeader } from '../render-header';
import { renderPage } from '../render-page';
import { tabList } from '../tab-list';
import { UserDetails } from '../user-details';

type GetUserDetails = (userId: UserId) => TE.TaskEither<DE.DataError, UserDetails>;

type Ports = SavedArticlesPorts & {
  getAllEvents: GetAllEvents,
  getUserDetails: GetUserDetails,
};

type Params = {
  id: UserId,
};

type SavedArticlesPage = (params: Params) => TE.TaskEither<RenderPageError, Page>;

export const savedArticlesPage = (ports: Ports): SavedArticlesPage => ({ id }) => pipe(
  {
    dois: projectSavedArticleDois(ports.getAllEvents)(id),
    groupIds: followedGroupIds(ports.getAllEvents)(id),
  },
  sequenceS(T.ApplyPar),
  T.chain(({ dois, groupIds }) => pipe(
    savedArticles(ports)(dois),
    T.map((content) => ({
      articleCount: dois.length,
      groupCount: groupIds.length,
      content,
    })),
  )),
  T.map(({ content, articleCount, groupCount }) => tabs({
    tabList: tabList(id, articleCount, groupCount),
    activeTabIndex: 0,
  })(content)),
  TE.rightTask,
  (mainContent) => ({
    header: pipe(
      ports.getUserDetails(id),
      TE.map(renderHeader),
    ),
    userDisplayName: pipe(
      ports.getUserDetails(id),
      TE.map(flow(
        ({ displayName }) => displayName,
        toHtmlFragment,
      )),
    ),
    mainContent,
  }),
  sequenceS(TE.ApplyPar),
  TE.bimap(renderErrorPage, renderPage),
);
