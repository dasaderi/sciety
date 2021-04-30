import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as TO from 'fp-ts/TaskOption';
import {
  followSomething, noEvaluationsYet, troubleFetchingTryAgain, welcomeMessage,
} from '../../../src/home-page/your-feed/render-feed';
import { yourFeed } from '../../../src/home-page/your-feed/your-feed';
import { Doi } from '../../../src/types/doi';
import { editorialCommunityReviewedArticle, userFollowedEditorialCommunity } from '../../../src/types/domain-events';
import { GroupId } from '../../../src/types/group-id';
import { toHtmlFragment } from '../../../src/types/html-fragment';
import { sanitise } from '../../../src/types/sanitised-html-fragment';
import { toUserId } from '../../../src/types/user-id';
import { shouldNotBeCalled } from '../../should-not-be-called';

describe('followed-groups-activities-acceptance', () => {
  describe('there is no logged in user', () => {
    it('displays a welcome message', async () => {
      const adapters = {
        fetchArticle: shouldNotBeCalled,
        getGroup: shouldNotBeCalled,
        getAllEvents: shouldNotBeCalled,
        follows: shouldNotBeCalled,
      };

      const html = await yourFeed(adapters)(O.none)();

      expect(html).toContain(welcomeMessage);
    });
  });

  describe('there is a logged in user', () => {
    const userId = toUserId('alice');

    describe('following groups that have no evaluations', () => {
      it('displays the calls to action to follow other groups or return later', async () => {
        const adapters = {
          fetchArticle: shouldNotBeCalled,
          getGroup: shouldNotBeCalled,
          getAllEvents: T.of([userFollowedEditorialCommunity(userId, new GroupId('NCRC'))]),
          follows: () => T.of(true),
        };

        const html = await yourFeed(adapters)(O.some(userId))();

        expect(html).toContain(noEvaluationsYet);
      });
    });

    // Your feed is empty! Start following some groups to see their most recent evaluations right here.
    describe('not following any groups', () => {
      it('displays call to action to follow groups', async () => {
        const adapters = {
          fetchArticle: shouldNotBeCalled,
          getGroup: shouldNotBeCalled,
          getAllEvents: T.of([]),
          follows: () => T.of(false),
        };
        const html = await yourFeed(adapters)(O.some(userId))();

        expect(html).toContain(followSomething);
      });
    });

    describe('following groups with evaluations', () => {
      it.skip('displays content in the form of article cards', async () => {
        const groupId = new GroupId('NCRC');
        const adapters = {
          fetchArticle: () => TE.right({
            title: sanitise(toHtmlFragment('My article title')),
          }),
          getGroup: () => TO.some({
            id: groupId,
            name: 'NCRC',
            avatarPath: '',
            descriptionPath: '',
            shortDescription: '',
          }),
          getAllEvents: T.of([
            userFollowedEditorialCommunity(userId, groupId),
            editorialCommunityReviewedArticle(groupId, new Doi('10.1101/111111'), new Doi('10.1101/222222')),
          ]),
          follows: () => T.of(true),
        };
        const html = await yourFeed(adapters)(O.some(userId))();

        expect(html).toContain('class="article-activity-card"');
      });

      it.todo('display a maximum of 20 articles');

      it.todo('displays the articles in order of latest activity in descending order');

      it.todo('latest activity is based off of activity by any group');

      it('displayed articles have to have been evaluated by a followed group', async () => {
        const groupId = new GroupId('NCRC');
        const adapters = {
          fetchArticle: () => TE.right({
            title: sanitise(toHtmlFragment('My article title')),
          }),
          getGroup: () => TO.some({
            id: groupId,
            name: 'NCRC',
            avatarPath: '',
            descriptionPath: '',
            shortDescription: '',
          }),
          getAllEvents: T.of([
            userFollowedEditorialCommunity(userId, groupId),
            editorialCommunityReviewedArticle(groupId, new Doi('10.1101/111111'), new Doi('10.1101/222222')),
          ]),
          follows: () => T.of(true),
        };
        const html = await yourFeed(adapters)(O.some(userId))();

        expect(html).toContain('My article title');
      });

      it.todo('each article is only displayed once');

      describe('when details of an article cannot be fetched', () => {
        it.todo('display the other 19 articles only');
      });

      describe('when details of all articles cannot be fetched', () => {
        it.skip('display only an error message', async () => {
          const groupId = new GroupId('NCRC');
          const adapters = {
            fetchArticle: () => TE.left('unavailable' as const),
            getGroup: () => TO.some({
              id: groupId,
              name: 'NCRC',
              avatarPath: '',
              descriptionPath: '',
              shortDescription: '',
            }),
            getAllEvents: T.of([
              userFollowedEditorialCommunity(userId, groupId),
              editorialCommunityReviewedArticle(groupId, new Doi('10.1101/111111'), new Doi('10.1101/222222')),
            ]),
            follows: () => T.of(true),
          };
          const html = await yourFeed(adapters)(O.some(userId))();

          expect(html).toContain(troubleFetchingTryAgain);
        });
      });
    });
  });
});
