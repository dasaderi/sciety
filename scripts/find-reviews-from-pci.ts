import fs from 'fs';
import axios from 'axios';
import { printf } from 'fast-printf';
import { pipe } from 'fp-ts/function';
import { DOMParser } from 'xmldom';

/*
pipe(
  groups,
  RA.map(
    flow(
      fetch feed
      T.Map flow(
        xml-to-json (xml-js),
        decode feed,
        E.map flow(array links => array options<reviews>, compact, fs.writeFileSync),
        E.mapLeft log error,
      )
    )
*/

type Group = {
  id: string,
  prefix: string,
  url: string,
};

const groups: Array<Group> = [
  { id: '74fd66e9-3b90-4b5a-a4ab-5be83db4c5de', prefix: 'zool', url: 'https://zool.peercommunityin.org/rss/rss4elife' },
  { id: '19b7464a-edbe-42e8-b7cc-04d1eb1f7332', prefix: 'evolbiol', url: 'https://evolbiol.peercommunityin.org/rss/rss4elife' },
  { id: '32025f28-0506-480e-84a0-b47ef1e92ec5', prefix: 'ecology', url: 'https://ecology.peercommunityin.org/rss/rss4elife' },
  { id: '4eebcec9-a4bb-44e1-bde3-2ae11e65daaa', prefix: 'animsci', url: 'https://animsci.peercommunityin.org/rss/rss4elife' },
  { id: 'b90854bf-795c-42ba-8664-8257b9c68b0c', prefix: 'archaeo', url: 'https://archaeo.peercommunityin.org/rss/rss4elife' },
  { id: '7a9e97d1-c1fe-4ac2-9572-4ecfe28f9f84', prefix: 'paleo', url: 'https://paleo.peercommunityin.org/rss/rss4elife' },
];

const parser = new DOMParser({
  errorHandler: (_, msg) => {
    throw msg;
  },
});

type Evaluation = {
  date: Date,
  articleDoi: string,
  reviewDoi: string,
};

const fetchPage = async (url: string): Promise<{ data: string }> => {
  try {
    return await axios.get(url);
  } catch (e: unknown) {
    process.stderr.write(`Could not fetch ${url}\n`);
    throw e;
  }
};

const fetchEvaluations = async (group: Group): Promise<Array<Evaluation>> => {
  const result = [];

  const { data: feed } = await fetchPage(group.url);
  const doc = parser.parseFromString(feed, 'text/xml');

  // eslint-disable-next-line no-loops/no-loops
  for (const link of Array.from(doc.getElementsByTagName('link'))) {
    const articleDoiString = link.getElementsByTagName('doi')[1]?.textContent ?? '';
    const reviewDoiString = link.getElementsByTagName('doi')[0]?.textContent ?? '';
    const date = link.getElementsByTagName('date')[0]?.textContent ?? '';

    const bioAndmedrxivDoiRegex = /^\s*(?:doi:|(?:(?:https?:\/\/)?(?:dx\.)?doi\.org\/))?(10\.1101\/(?:[^%"#?\s])+)\s*$/;
    const [, articleDoi] = bioAndmedrxivDoiRegex.exec(articleDoiString) ?? [];

    if (articleDoi) {
      const reviewDoi = reviewDoiString.replace('https://doi.org/', '').replace('http://dx.doi.org/', '');
      result.push({
        date: new Date(date),
        articleDoi,
        reviewDoi,
      });
    }
  }

  return result;
};

const writeCsv = (group: Group) => (evaluations: ReadonlyArray<Evaluation>) => {
  const reviewsFilename = `./data/reviews/${group.id}.csv`;
  const contents = evaluations.map((evaluation) => (
    `${evaluation.date.toISOString()},${evaluation.articleDoi},doi:${evaluation.reviewDoi}\n`
  )).join('');
  fs.writeFileSync(reviewsFilename, `Date,Article DOI,Review ID\n${contents}`);
  const report = printf('PCI %-30s %5d evaluations\n', group.prefix, evaluations.length);
  process.stderr.write(report);
};

void (async (): Promise<void> => {
  groups.forEach(async (group) => {
    pipe(
      await fetchEvaluations(group),
      writeCsv(group),
    );
  });
})();
