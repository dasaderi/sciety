import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import { flow, pipe } from 'fp-ts/function';
import { GroupId } from '../types/group-id';
import { HtmlFragment, toHtmlFragment } from '../types/html-fragment';
import { UserId } from '../types/user-id';

type Group = {
  id: GroupId,
  name: string,
  avatarPath: string,
};

type RenderFollowedEditorialCommunity = (userId: O.Option<UserId>) => (
  group: Group,
) => T.Task<HtmlFragment>;

type RenderFollowToggle = (g: GroupId) => (isFollowing: boolean) => HtmlFragment;

const render = (group: Group) => (toggle: HtmlFragment) => `
  <img class="followed-groups__item_avatar" src="${group.avatarPath}" alt="">
  <a class="followed-groups__item_link" href="/groups/${group.id.value}">${group.name}</a>
  ${toggle}
`;

export type Follows = (u: UserId, g: GroupId) => T.Task<boolean>;

export const renderFollowedEditorialCommunity = (
  renderFollowToggle: RenderFollowToggle,
  follows: Follows,
): RenderFollowedEditorialCommunity => (userId) => (group) => pipe(
  userId,
  O.fold(
    () => T.of(false),
    (u: UserId) => follows(u, group.id),
  ),
  T.map(flow(
    renderFollowToggle(group.id),
    render(group),
    toHtmlFragment,
  )),
);
