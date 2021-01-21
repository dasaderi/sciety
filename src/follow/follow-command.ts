import * as T from 'fp-ts/lib/Task';
import { UserFollowedEditorialCommunityEvent } from '../types/domain-events';
import { EditorialCommunityId } from '../types/editorial-community-id';
import { FollowList } from '../types/follow-list';
import { User } from '../types/user';
import { UserId } from '../types/user-id';

export type CommitEvents = (events: ReadonlyArray<UserFollowedEditorialCommunityEvent>) => T.Task<void>;
export type GetFollowList = (userId: UserId) => Promise<FollowList>;

type FollowCommand = (user: User, editorialCommunityId: EditorialCommunityId) => Promise<void>;

export const createFollowCommand = (
  getFollowList: GetFollowList,
  commitEvents: CommitEvents,
): FollowCommand => (
  async (user, editorialCommunityId) => {
    const followList = await getFollowList(user.id);
    const events = followList.follow(editorialCommunityId);
    await commitEvents(events)();
  }
);
