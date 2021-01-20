import * as T from 'fp-ts/lib/Task';
import createGetMostRecentEvents, { Follows, GetAllEvents } from '../../src/home-page/get-most-recent-events';
import Doi from '../../src/types/doi';
import { DomainEvent } from '../../src/types/domain-events';
import EditorialCommunityId from '../../src/types/editorial-community-id';
import { toUserId } from '../../src/types/user-id';

describe('get-most-recent-events', () => {
  const editorialCommunity1 = new EditorialCommunityId('a');
  const dummyEvent: DomainEvent = {
    type: 'EditorialCommunityEndorsedArticle',
    date: new Date('2020-07-08'),
    editorialCommunityId: editorialCommunity1,
    articleId: new Doi('10.1101/751099'),
  };

  it('reverse the order into date descending', async () => {
    const initial: ReadonlyArray<DomainEvent> = [
      {
        type: 'EditorialCommunityEndorsedArticle',
        date: new Date('2020-07-08'),
        editorialCommunityId: editorialCommunity1,
        articleId: new Doi('10.1101/751099'),
      },
      {
        type: 'EditorialCommunityReviewedArticle',
        date: new Date('2020-07-09'),
        editorialCommunityId: editorialCommunity1,
        articleId: new Doi('10.1101/2020.01.22.915660'),
        reviewId: new Doi('10.1234/5678'),
      },
    ];
    const getAllEvents: GetAllEvents = T.of(initial);
    const follows: Follows = () => T.of(true);
    const getEvents = createGetMostRecentEvents(getAllEvents, follows, 20);
    const sortedEvents = await getEvents(toUserId('user-1'))();

    expect(sortedEvents[0]).toStrictEqual(initial[1]);
    expect(sortedEvents[1]).toStrictEqual(initial[0]);
  });

  it.todo('only returns events for the follow list');

  describe('when there\'s a small number of items', () => {
    it('returns exactly those', async () => {
      const dummyEvents: ReadonlyArray<DomainEvent> = [dummyEvent, dummyEvent, dummyEvent];
      const getAllEvents: GetAllEvents = T.of(dummyEvents);
      const follows: Follows = () => T.of(true);
      const getEvents = createGetMostRecentEvents(getAllEvents, follows, 20);
      const events = await getEvents(toUserId('user-1'))();

      expect(events).toHaveLength(dummyEvents.length);
    });
  });

  describe('when there are more items than the specified maximum', () => {
    it('returns just the specified maximum number of items', async () => {
      const dummyEvents: ReadonlyArray<DomainEvent> = [dummyEvent, dummyEvent, dummyEvent];
      const maxCount = 2;
      const getAllEvents: GetAllEvents = T.of(dummyEvents);
      const follows: Follows = () => T.of(true);
      const getEvents = createGetMostRecentEvents(getAllEvents, follows, maxCount);
      const events = await getEvents(toUserId('user-1'))();

      expect(events).toHaveLength(maxCount);
    });
  });
});
