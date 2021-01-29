import { URL } from 'url';
import * as T from 'fp-ts/lib/Task';
import { Result } from 'true-myth';
import { constructFeedItem, GetArticle } from '../../src/editorial-community-page/construct-feed-item';
import { FeedItem } from '../../src/shared-components/render-summary-feed-list';
import { Doi } from '../../src/types/doi';
import { EditorialCommunityReviewedArticleEvent } from '../../src/types/domain-events';
import { EditorialCommunity } from '../../src/types/editorial-community';
import { EditorialCommunityId } from '../../src/types/editorial-community-id';
import { SanitisedHtmlFragment } from '../../src/types/sanitised-html-fragment';

describe('construct-feed-item', (): void => {
  const articleTitle = 'the title' as SanitisedHtmlFragment;
  const arbitraryActorId = new EditorialCommunityId('');
  const arbitraryArticleId = new Doi('10.5281/zenodo.3678326');
  const community: EditorialCommunity = {
    id: new EditorialCommunityId('my-community'),
    name: 'dummyActorName',
    descriptionPath: '',
    avatar: new URL('http://example.com/image'),
  };

  describe('when given an EditorialCommunityReviewedArticleEvent', () => {
    const event: EditorialCommunityReviewedArticleEvent = {
      type: 'EditorialCommunityReviewedArticle',
      date: new Date('2020-01-01'),
      editorialCommunityId: arbitraryActorId,
      articleId: arbitraryArticleId,
      reviewId: new Doi('10.1234/5678'),
    };
    let feedItem: FeedItem;

    describe('and the article information can be retrieved', () => {
      beforeEach(async () => {
        const getArticle: GetArticle = () => T.of(Result.ok({
          title: articleTitle,
        }));
        feedItem = await constructFeedItem(getArticle)(community)(event)();
      });

      it('displays the article title', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ title: articleTitle }));
      });

      it('displays the word "reviewed"', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ verb: 'reviewed' }));
      });

      it('displays the actor name', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ actorName: 'dummyActorName' }));
      });

      it('displays the event date', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ date: new Date('2020-01-01') }));
      });
    });

    describe('and the article information cannot be retrieved', () => {
      beforeEach(async () => {
        const getArticle: GetArticle = () => T.of(Result.err('something-bad'));
        feedItem = await constructFeedItem(getArticle)(community)(event)();
      });

      it('displays a generic article title', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ title: 'an article' }));
      });

      it('displays the word "reviewed"', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ verb: 'reviewed' }));
      });

      it('displays the actor name', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ actorName: 'dummyActorName' }));
      });

      it('displays the event date', async () => {
        expect(feedItem).toStrictEqual(expect.objectContaining({ date: new Date('2020-01-01') }));
      });
    });
  });
});
