import { URL } from 'url';
import * as Eq from 'fp-ts/Eq';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import { pipe } from 'fp-ts/function';
import * as S from 'fp-ts/string';
import { Doi } from './doi';
import * as NcrcId from './ncrc-id';

type ServiceBasedReviewId = string & { readonly ServiceBasedReviewId: unique symbol };

export type ReviewId = Doi | NcrcId.NcrcId | ServiceBasedReviewId;

const toReviewId = (serialization: string): ReviewId => {
  const [, protocol, value] = /^(.+?):(.+)$/.exec(serialization) ?? [];
  switch (protocol) {
    case 'doi':
      return new Doi(value);
    case 'hypothesis':
      return serialization as unknown as ServiceBasedReviewId;
    case 'ncrc':
      return NcrcId.fromString(value);
    case 'prelights':
      return serialization as unknown as ServiceBasedReviewId;
    case 'rapidreviews':
      return serialization as unknown as ServiceBasedReviewId;
    default:
      throw new Error(`Unable to unserialize ReviewId: "${serialization}"`);
  }
};

export const deserialize = (value: string): O.Option<ReviewId> => O.tryCatch(() => toReviewId(value));

export const serialize = (id: ReviewId): string => {
  if (id instanceof Doi) {
    return id.toString();
  }

  if (NcrcId.isNrcId(id)) {
    return `ncrc:${id.value}`;
  }

  return id;
};

export const service = (id: ReviewId): string => {
  if (id instanceof Doi) {
    return 'doi';
  }
  if (NcrcId.isNrcId(id)) {
    return 'ncrc';
  }
  return id.split(':')[0];
};

export const key = (id: ReviewId): string => {
  if (id instanceof Doi) {
    return id.value;
  }
  if (NcrcId.isNrcId(id)) {
    return id.value;
  }
  return id.slice(id.indexOf(':') + 1);
};

const urlTemplates = ({
  doi: (id: ReviewId) => `https://doi.org/${key(id)}`,
  hypothesis: (id: ReviewId) => `https://hypothes.is/a/${key(id)}`,
  prelights: (id: ReviewId) => key(id),
  rapidreviews: (id: ReviewId) => key(id),
});

export const inferredUrl = (id: ReviewId): O.Option<URL> => pipe(
  urlTemplates,
  R.lookup(service(id)),
  O.map((template) => template(id)),
  O.map((u) => new URL(u)),
);

export const isReviewId = (value: unknown): value is ReviewId => (
  value instanceof Doi || NcrcId.isNrcId(value)
);

const eq: Eq.Eq<ReviewId> = pipe(
  S.Eq,
  Eq.contramap(serialize),
);

export const { equals } = eq;
