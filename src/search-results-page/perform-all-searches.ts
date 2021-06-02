import { sequenceS } from 'fp-ts/Apply';
import * as O from 'fp-ts/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { constant, pipe, tupled } from 'fp-ts/function';
import * as t from 'io-ts';
import * as tt from 'io-ts-types';
import { ArticleItem } from './data-types';
import { Matches } from './select-subset-to-display';
import { GroupId } from '../types/group-id';

type ArticleResults = {
  items: ReadonlyArray<ArticleItem>,
  total: number,
  nextCursor: O.Option<string>,
};

type FindArticles = (pageSize: number) => (query: string, cursor: O.Option<string>) => TE.TaskEither<'unavailable', ArticleResults>;

type FindGroups = (q: string) => T.Task<ReadonlyArray<GroupId>>;

export type Ports = {
  findGroups: FindGroups,
  searchEuropePmc: FindArticles,
};

export const paramsCodec = t.type({
  query: t.string,
  category: tt.optionFromNullable(
    t.union([
      t.literal('groups'),
      t.literal('articles'),
    ]),
  ),
  cursor: tt.optionFromNullable(t.string),
});

export type Params = t.TypeOf<typeof paramsCodec> & {
  pageSize: number,
};

export const performAllSearches = (ports: Ports) => (params: Params): TE.TaskEither<'unavailable', Matches> => pipe(
  {
    query: TE.right(params.query),
    pageSize: TE.right(params.pageSize),
    category: TE.right(O.getOrElse(constant('articles'))(params.category)),
    articles: pipe(
      [params.query, params.cursor],
      tupled(ports.searchEuropePmc(params.pageSize)),
    ),
    groups: pipe(
      params.query,
      ports.findGroups, // TODO: should only ask for 10 of n; should return a TE
      T.map(RA.map((groupId) => ({ id: groupId }))),
      TE.rightTask,
    ),
  },
  sequenceS(TE.ApplyPar),
);
