import * as E from 'fp-ts/Either';
import { createSearchEuropePmc, GetJson } from '../../src/infrastructure/search-europe-pmc';
import { Doi } from '../../src/types/doi';
import dummyLogger from '../dummy-logger';

describe('search-europe-pmc adapter', () => {
  it('converts Europe PMC search result into our Domain Model', async () => {
    const adapter = createSearchEuropePmc(async () => ({
      hitCount: 1,
      resultList: {
        result: [
          {
            doi: '10.1111/1234',
            title: 'Article title',
            authorString: 'Author 1, Author 2',
            firstPublicationDate: '2019-11-07',
          },
        ],
      },
    }), dummyLogger);

    const results = await adapter('some query')();

    const expected = E.right({
      total: 1,
      items: [
        {
          doi: new Doi('10.1111/1234'),
          title: 'Article title',
          authors: 'Author 1, Author 2',
          postedDate: new Date('2019-11-07'),
        },
      ],
    });

    expect(results).toStrictEqual(expected);
  });

  it('constructs the Europe PMC query safely', async () => {
    const getJson: GetJson = async () => ({
      hitCount: 0,
      resultList: {
        result: [],
      },
    });
    const spy = jest.fn(getJson);
    const adapter = createSearchEuropePmc(spy, dummyLogger);

    await adapter('Structural basis of αE&')();

    expect(spy).toHaveBeenCalledTimes(1);

    const uri = spy.mock.calls[0][0];

    // Tests special character encoding, biorxiv publisher or medrxiv publisher, sort date, and parameter order.
    expect(uri).toContain('?query=Structural+basis+of+%CE%B1E%26+%28PUBLISHER%3A%22bioRxiv%22+OR+PUBLISHER%3A%22medRxiv%22%29+sort_date%3Ay&');
  });
});
