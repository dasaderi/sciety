import * as T from 'fp-ts/Task';
import { Maybe } from 'true-myth';
import { EditorialCommunity } from './editorial-community';
import { EditorialCommunityId } from './editorial-community-id';

export type EditorialCommunityRepository = {
  add(editorialCommunity: EditorialCommunity): Promise<void>,
  all: T.Task<Array<EditorialCommunity>>,
  lookup(id: EditorialCommunityId): T.Task<Maybe<EditorialCommunity>>,
};
