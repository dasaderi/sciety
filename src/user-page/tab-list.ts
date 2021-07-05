import { Tab } from '../shared-components/tabs';
import { toHtmlFragment } from '../types/html-fragment';
import { UserId } from '../types/user-id';

export const tabList = (userId: UserId, savedArticleCount: number, followedGroupsCount: number): [Tab, Tab] => [
  {
    label: toHtmlFragment(`Saved articles (${savedArticleCount})`),
    url: `/users/${userId}/saved-articles`,
  },
  {
    label: toHtmlFragment(`Following (${followedGroupsCount})`),
    url: `/users/${userId}/followed-groups`,
  },
];
