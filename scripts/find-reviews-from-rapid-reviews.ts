import axios from 'axios';
import * as RA from 'fp-ts/ReadonlyArray';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { constant, pipe } from 'fp-ts/function';
import * as t from 'io-ts';
import * as tt from 'io-ts-types';
import * as PR from 'io-ts/PathReporter';

const rapidReviewCodec = t.type({
  message: t.type({
    items: t.array(t.type({
      URL: t.string,
      created: t.type({
        'date-time': tt.DateFromISOString,
      }),
      relation: t.type({
        'is-review-of': t.array(t.type({
          id: t.string,
        })),
      }),
    })),
  }),
});

const extractEvaluations = (data: t.TypeOf<typeof rapidReviewCodec>) => pipe(
  data.message.items.map((item) => ({
    date: item.created['date-time'].toISOString(),
    articleDoi: item.relation['is-review-of'][0].id,
    evaluationLocator: `rapidreviews:${item.URL}`,
  })),
  RA.filter(({ articleDoi }) => articleDoi.startsWith('10.1101/')),
);

const getJson = (url: string): T.Task<JSON> => async () => axios.get<JSON>(url, {
  headers: {
    'User-Agent': 'Sciety (http://sciety.org; mailto:team@sciety.org)',
  },
})
  .then((response) => response.data);

void (async (): Promise<void> => {
  await pipe(
    'https://api.crossref.org/prefixes/10.1162/works?filter=type:peer-review',
    getJson,
    T.map(rapidReviewCodec.decode),
    TE.map(extractEvaluations),
    TE.bimap(
      (errors) => process.stderr.write(PR.failure(errors).join('\n')),
      (evaluations) => {
        process.stdout.write('Date,Article DOI,Review ID\n');
        pipe(
          evaluations,
          RA.map(({ date, articleDoi, evaluationLocator }) => process.stdout.write(`${date},${articleDoi},${evaluationLocator}\n`)),
        );
      },
    ),
    TE.match(constant(1), constant(0)),
    T.map((exitStatus) => process.exit(exitStatus)),
  )();
})();
