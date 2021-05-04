import { URL } from 'url';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { JSDOM } from 'jsdom';
import { renderReviewFeedItem } from '../../src/article-page/render-review-feed-item';
import { Doi } from '../../src/types/doi';
import { GroupId } from '../../src/types/group-id';
import { toHtmlFragment } from '../../src/types/html-fragment';
import { sanitise } from '../../src/types/sanitised-html-fragment';

const arbitraryDoi = () => new Doi('10.1101/arbitrary.doi.1');

describe('render-review-feed-item', () => {
  describe('when the review has long full text', () => {
    let rendered: DocumentFragment;
    const fullText = 'A very long review';
    const articleId = arbitraryDoi();

    beforeEach(() => {
      rendered = JSDOM.fragment(
        renderReviewFeedItem(6)({
          type: 'review',
          id: articleId,
          source: O.some(new URL('http://example.com')),
          occurredAt: new Date(),
          groupId: new GroupId('group-1'),
          groupName: 'group 1',
          groupAvatar: '/avatar',
          fullText: pipe(fullText, toHtmlFragment, sanitise, O.some),
          counts: {
            helpfulCount: 0,
            notHelpfulCount: 0,
          },
          current: O.none,
        }),
      );
    });

    it('renders the full text', async () => {
      const toggleableContent = rendered.querySelector('[data-behaviour="collapse_to_teaser"]');
      const fullTextWrapper = rendered.querySelector('[data-full-text]');
      const teaserWrapper = rendered.querySelector('[data-teaser]');

      expect(toggleableContent).not.toBeNull();
      expect(fullTextWrapper?.textContent).toStrictEqual(expect.stringContaining(fullText));
      expect(teaserWrapper?.textContent).toStrictEqual(expect.stringContaining('A …'));
    });

    it('renders an id tag with the correct value', async () => {
      expect(rendered.getElementById(`doi:${articleId.value}`)).not.toBeNull();
    });
  });

  describe('when the review has short full text', () => {
    let rendered: DocumentFragment;
    const fullText = 'tldr';
    const source = 'http://example.com/source';
    const articleId = arbitraryDoi();

    beforeEach(() => {
      rendered = JSDOM.fragment(
        renderReviewFeedItem(12)({
          type: 'review',
          id: articleId,
          source: O.some(new URL(source)),
          occurredAt: new Date(),
          groupId: new GroupId('group-1'),
          groupName: 'group 1',
          groupAvatar: '/avatar',
          fullText: pipe(fullText, toHtmlFragment, sanitise, O.some),
          counts: {
            helpfulCount: 0,
            notHelpfulCount: 0,
          },
          current: O.none,
        }),
      );
    });

    it('renders without a teaser', async () => {
      const toggleableContent = rendered.querySelector('[data-behaviour="collapse_to_teaser"]');
      const fullTextWrapper = rendered.querySelector('.activity-feed__item_body');
      const teaserWrapper = rendered.querySelector('[data-teaser]');
      const sourceLinkUrl = rendered.querySelector('.activity-feed__item__read_more')?.getAttribute('href');

      expect(toggleableContent).toBeNull();
      expect(teaserWrapper).toBeNull();
      expect(fullTextWrapper?.textContent).toStrictEqual(expect.stringContaining(fullText));
      expect(sourceLinkUrl).toStrictEqual(source);
    });

    it('renders an id tag with the correct value', async () => {
      expect(rendered.getElementById(`doi:${articleId.value}`)).not.toBeNull();
    });
  });

  describe('when the review has no full text', () => {
    const source = 'http://example.com/source';
    let rendered: DocumentFragment;
    const articleId = arbitraryDoi();

    beforeEach(() => {
      rendered = JSDOM.fragment(
        renderReviewFeedItem(6)({
          type: 'review',
          id: articleId,
          source: O.some(new URL(source)),
          occurredAt: new Date(),
          groupId: new GroupId('group-1'),
          groupName: 'group 1',
          groupAvatar: '/avatar',
          fullText: O.none,
          counts: {
            helpfulCount: 0,
            notHelpfulCount: 0,
          },
          current: O.none,
        }),
      );
    });

    it('renders without a teaser', async () => {
      const toggleableContent = rendered.querySelector('[data-behaviour="collapse_to_teaser"]');
      const sourceLinkUrl = rendered.querySelector('.activity-feed__item__read_more')?.getAttribute('href');

      expect(toggleableContent).toBeNull();
      expect(sourceLinkUrl).toStrictEqual(source);
    });

    it('renders an id tag with the correct value', async () => {
      expect(rendered.getElementById(`doi:${articleId.value}`)).not.toBeNull();
    });
  });
});
