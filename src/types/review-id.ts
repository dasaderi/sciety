import { URL } from 'url';
import * as Eq from 'fp-ts/Eq';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import { pipe } from 'fp-ts/function';
import * as S from 'fp-ts/string';

export type ReviewId = string & { readonly ReviewId: unique symbol };

const supportedServices = ['doi', 'hypothesis', 'ncrc', 'prelights', 'rapidreviews'];

const toReviewId = (serialization: string): ReviewId => {
  const [, service] = /^(.+?):(.+)$/.exec(serialization) ?? [];
  if (supportedServices.includes(service)) {
    return serialization as unknown as ReviewId;
  }

  throw new Error(`Unable to unserialize ReviewId: "${serialization}"`);
};

export const deserialize = (value: string): O.Option<ReviewId> => O.tryCatch(() => toReviewId(value));

export const serialize = (id: ReviewId): string => id;

export const service = (id: ReviewId): string => id.split(':')[0];

export const key = (id: ReviewId): string => id.slice(id.indexOf(':') + 1);

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
  true
);

const eq: Eq.Eq<ReviewId> = pipe(
  S.Eq,
  Eq.contramap(serialize),
);

export const { equals } = eq;
