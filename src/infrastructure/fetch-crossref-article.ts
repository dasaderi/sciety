import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { Result } from 'true-myth';
import { DOMParser, XMLSerializer } from 'xmldom';
import { Logger } from './logger';
import Doi from '../types/doi';
import { toHtmlFragment } from '../types/html-fragment';
import { sanitise, SanitisedHtmlFragment } from '../types/sanitised-html-fragment';

type FetchCrossrefArticleError = 'not-found' | 'unavailable';

export type FetchCrossrefArticle = (doi: Doi) => T.Task<Result<{
  abstract: SanitisedHtmlFragment;
  authors: Array<string>;
  doi: Doi;
  title: SanitisedHtmlFragment;
  publicationDate: Date;
}, FetchCrossrefArticleError>>;

export type GetXml = (doi: Doi, acceptHeader: string) => Promise<string>;

export default (getXml: GetXml, logger: Logger): FetchCrossrefArticle => {
  const serializer = new XMLSerializer();

  const getElement = (ancestor: Document | Element, qualifiedName: string): Element | null => (
    ancestor.getElementsByTagName(qualifiedName).item(0)
  );

  const getAbstract = (doc: Document, doi: Doi): string => {
    const abstractElement = getElement(doc, 'abstract');

    if (typeof abstractElement?.textContent !== 'string') {
      logger('warn', 'Did not find abstract', { doi });

      return `No abstract for ${doi.value} available`;
    }

    logger('debug', 'Found abstract', { doi, abstract: abstractElement.textContent });

    const titleElement = getElement(abstractElement, 'title');
    if (titleElement) {
      abstractElement.removeChild(titleElement);
    }

    const titles = abstractElement.getElementsByTagName('title');
    for (let i = 0; i < titles.length; i += 1) {
      const title = titles.item(i);
      if (title) {
        if (title.textContent === 'Graphical abstract') {
          abstractElement.removeChild(title);
        }
      }
    }

    const abstract = serializer.serializeToString(abstractElement);

    const transformXmlToHtml = (xml: string): string => (
      xml
        .replace(/<abstract[^>]*>/, '')
        .replace(/<\/abstract>/, '')
        .replace(/<italic[^>]*>/g, '<i>')
        .replace(/<\/italic>/g, '</i>')
        .replace(/<list[^>]* list-type=['"]bullet['"][^>]*/g, '<ul')
        .replace(/<\/list>/g, '</ul>')
        .replace(/<list-item[^>]*/g, '<li')
        .replace(/<\/list-item>/g, '</li>')
        .replace(/<sec[^>]*/g, '<section')
        .replace(/<\/sec>/g, '</section>')
        .replace(/<title[^>]*/g, '<h3')
        .replace(/<\/title>/g, '</h3>')
    );

    const stripEmptySections = (html: string): string => (
      html.replace(/<section>\s*<\/section>/g, '')
    );

    return pipe(
      abstract,
      transformXmlToHtml,
      toHtmlFragment,
      sanitise,
      stripEmptySections,
    );
  };

  const getAuthors = (doc: Document, doi: Doi): Array<string> => {
    const contributorsElement = getElement(doc, 'contributors');

    if (!contributorsElement || typeof contributorsElement?.textContent !== 'string') {
      logger('debug', 'Did not find contributors', { doi });
      return [];
    }

    return Array.from(contributorsElement.getElementsByTagName('person_name'))
      .filter((person) => person.getAttribute('contributor_role') === 'author')
      .map((person) => {
        const givenName = person.getElementsByTagName('given_name')[0]?.textContent;
        // TODO: the decision as to what to display on error should live with th rendering component
        const surname = person.getElementsByTagName('surname')[0].textContent ?? 'Unknown author';

        if (!givenName) {
          return surname;
        }

        return `${givenName} ${surname}`;
      });
  };

  const getTitle = (doc: Document, doi: Doi): string => {
    const titlesElement = getElement(doc, 'titles');
    const titleElement = titlesElement?.getElementsByTagName('title')[0];
    if (!titleElement) {
      logger('warn', 'Did not find title', { doi });
      // TODO: the decision as to what to display on error should live with th rendering component
      return 'Unknown title';
    }

    return serializer.serializeToString(titleElement);
  };

  const getPublicationDate = (doc: Document): Date => {
    const postedDateElement = getElement(doc, 'posted_date');

    const postedDateYear = postedDateElement?.getElementsByTagName('year')[0];
    const year = postedDateYear?.textContent ?? '1970';

    const postedDateMonth = postedDateElement?.getElementsByTagName('month')[0];
    const month = postedDateMonth?.textContent ?? '01';

    const postedDateDay = postedDateElement?.getElementsByTagName('day')[0];
    const day = postedDateDay?.textContent ?? '01';

    return new Date(`${year}-${month}-${day}`);
  };

  const parser = new DOMParser({
    errorHandler: (_, msg) => {
      throw msg;
    },
  });

  return (doi) => async () => {
    // TODO:
    // pipe(
    //   fetch the xml,
    //   parse it,
    //   transform to our own Domain Model for an Article
    // )
    let response: string;
    try {
      response = await getXml(doi, 'application/vnd.crossref.unixref+xml');
    } catch (error: unknown) {
      const payload: Record<string, unknown> = {
        doi,
        error,
      };
      if (error instanceof Error) {
        payload.message = error.message;
      }
      logger('error', 'Failed to fetch article', payload);

      return Result.err('not-found');
    }

    try {
      const doc = parser.parseFromString(response, 'text/xml');
      return Result.ok({
        abstract: sanitise(toHtmlFragment(getAbstract(doc, doi))),
        authors: getAuthors(doc, doi),
        doi,
        title: sanitise(toHtmlFragment(getTitle(doc, doi))),
        publicationDate: getPublicationDate(doc),
      });
    } catch (error: unknown) {
      logger('error', 'Unable to parse document', { doi, response, error });

      // TODO: decide a product direction covering all scenarios:
      // - what happens with a 404?
      // - what happens with a 50x?
      // - what happens if the XML is corrupted?
      // - what happens if the title cannot be parsed (e.g. it's missing from the XML)?
      // - what happens if the abstract cannot be parsed (e.g. it has unforeseen tags)?
      // - ...
      return Result.err('unavailable');
    }
  };
};
