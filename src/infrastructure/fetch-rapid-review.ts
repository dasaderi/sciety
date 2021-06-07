import { URL } from 'url';
import * as TE from 'fp-ts/TaskEither';
import { EvaluationFetcher } from './fetch-review';
import { toHtmlFragment } from '../types/html-fragment';

export const fetchRapidReview: EvaluationFetcher = () => TE.right({
  fullText: toHtmlFragment('The authors make a convincing argument for re-envisioning US public health, employment and anti-discrimination laws around social solidarity, and a compelling case for further scholarship that considers the public health implications of employment law.'),
  url: new URL('https://doi.org/10.1162/2e3983f5.9328aef6'),
});
