import { sequenceS } from 'fp-ts/Apply';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { flow, pipe } from 'fp-ts/function';
import { followList, Ports as FollowListPorts } from './follow-list';
import { followedGroupIds } from './project-followed-group-ids';
import { tabs } from '../../shared-components/tabs';
import * as DE from '../../types/data-error';
import { toHtmlFragment } from '../../types/html-fragment';
import { Page } from '../../types/page';
import { RenderPageError } from '../../types/render-page-error';
import { UserId } from '../../types/user-id';
import { renderErrorPage } from '../render-error-page';
import { renderHeader } from '../render-header';
import { renderPage } from '../render-page';
import { projectSavedArticleDois } from '../saved-articles-page/project-saved-article-dois';
import { tabList } from '../tab-list';
import { UserDetails } from '../user-details';

type GetUserDetails = (userId: UserId) => TE.TaskEither<DE.DataError, UserDetails>;

type Ports = FollowListPorts & {
  getUserDetails: GetUserDetails,
};

type Params = {
  id: UserId,
};

type FollowedGroupsPage = (params: Params) => TE.TaskEither<RenderPageError, Page>;

export const followedGroupsPage = (ports: Ports): FollowedGroupsPage => ({ id }) => pipe(
  {
    activeTabIndex: TE.right(1 as const),
    dois: TE.rightTask(projectSavedArticleDois(ports.getAllEvents)(id)),
    groupIds: TE.rightTask(followedGroupIds(ports.getAllEvents)(id)),
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
  },
  sequenceS(TE.ApplyPar),
  TE.chainTaskK(({
    activeTabIndex, dois, groupIds, header, userDisplayName,
  }) => pipe(
    followList(ports)(groupIds),
    T.map((content) => (
      {
        articleCount: dois.length,
        groupCount: groupIds.length,
        content,
        activeTabIndex,
        header,
        userDisplayName,
      })),
  )),
  TE.map(({
    articleCount, groupCount, content, activeTabIndex, header, userDisplayName,
  }) => ({
    mainContent: tabs({
      tabList: tabList(id, articleCount, groupCount),
      activeTabIndex,
    })(content),
    header,
    userDisplayName,
  })),
  TE.bimap(renderErrorPage, renderPage),
);
