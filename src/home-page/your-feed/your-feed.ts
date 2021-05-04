import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as TO from 'fp-ts/TaskOption';
import { constant, flow, pipe } from 'fp-ts/function';
import { constructFeedItem } from './construct-feed-item';
import { followedGroups } from './followed-groups';
import { followedGroupsActivities } from './followed-groups-activities';
import { getActor, GetGroup } from './get-actor';
import { GetAllEvents, getMostRecentEvents } from './get-most-recent-events';
import { populateArticleViewModelsSkippingFailures } from './populate-article-view-models';
import {
  followSomething,
  noEvaluationsYet,
  welcomeMessage,
} from './static-messages';
import { renderSummaryFeedList } from '../../shared-components';
import { fetchArticleDetails } from '../../shared-components/article-card/fetch-article-details';
import { FindVersionsForArticleDoi, getLatestArticleVersionDate } from '../../shared-components/article-card/get-latest-article-version-date';
import { ArticleServer } from '../../types/article-server';
import { Doi } from '../../types/doi';
import { GroupId } from '../../types/group-id';
import { HtmlFragment, toHtmlFragment } from '../../types/html-fragment';
import { SanitisedHtmlFragment } from '../../types/sanitised-html-fragment';
import { UserId } from '../../types/user-id';

type GetArticle = (doi: Doi) => TE.TaskEither<unknown, {
  title: SanitisedHtmlFragment,
  server: ArticleServer,
  authors: ReadonlyArray<string>,
}>;

export type Ports = {
  fetchArticle: GetArticle,
  getGroup: GetGroup,
  getAllEvents: GetAllEvents,
  follows: (u: UserId, g: GroupId) => T.Task<boolean>,
  findVersionsForArticleDoi: FindVersionsForArticleDoi,
};

const renderEventSummaries = (ports: Ports) => flow(
  T.traverseArray(constructFeedItem(getActor(ports.getGroup), ports.fetchArticle)),
  T.map(RNEA.fromReadonlyArray), // TODO shouldn't be needed, fp-ts types needs fixing
  TO.match(constant(pipe('', toHtmlFragment)), renderSummaryFeedList),
);

const renderAsSection = (contents: HtmlFragment): HtmlFragment => toHtmlFragment(`
  <section>
    <h2>
      Feed
    </h2>
    ${contents}
  </section>
`);

type YourFeed = (ports: Ports) => (
  userId: O.Option<UserId>,
) => T.Task<HtmlFragment>;

export const yourFeed: YourFeed = (ports) => (userId) => pipe(
  userId,
  TE.fromOption(constant(welcomeMessage)),
  TE.chain((uId) => pipe(
    ports.getAllEvents,
    T.map((events) => followedGroups(events)(uId)),
    T.map(RNEA.fromReadonlyArray),
    T.map(E.fromOption(constant(followSomething))),
    TE.map((groups) => ({ uId, groups })),
  )),
  TE.chain(({ uId, groups }) => pipe(
    ports.getAllEvents,
    T.map((events) => followedGroupsActivities(events)(groups)),
    T.map(RNEA.fromReadonlyArray),
    T.map(E.fromOption(constant(noEvaluationsYet))),
    TE.chainTaskK(populateArticleViewModelsSkippingFailures(
      fetchArticleDetails(
        getLatestArticleVersionDate(ports.findVersionsForArticleDoi),
        flow(ports.fetchArticle, T.map(O.fromEither)),
      ),
    )),
    TE.map(() => uId),
  )),
  TE.chainW(flow(
    getMostRecentEvents(ports.getAllEvents, ports.follows, 20),
    T.map(RNEA.fromReadonlyArray),
    T.chain(TE.fromOption(constant(noEvaluationsYet))), // TODO: this is unreachable code
  )),
  TE.chainTaskK(renderEventSummaries(ports)),
  TE.toUnion,
  T.map(flow(
    toHtmlFragment,
    renderAsSection,
  )),
);
