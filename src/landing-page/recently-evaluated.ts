import { templateDate } from '../shared-components/date';
import { toHtmlFragment } from '../types/html-fragment';

type Card = {
  articleId: string,
  articleTitle: string,
  date: Date,
  groupId: string,
  groupName: string,
  avatarPath: string,
};

const card1: Card = {
  articleId: '10.1101/2021.01.18.427171',
  articleTitle: 'Python-Microscope: High performance control of arbitrarily complex and scalable bespoke microscopes',
  date: new Date('2021-05-06'),
  groupId: '316db7d9-88cc-4c26-b386-f067e0f56334',
  groupName: 'Review Commons',
  avatarPath: '/static/groups/review-commons--316db7d9-88cc-4c26-b386-f067e0f56334.jpg',
};

const card2: Card = {
  articleId: '10.1101/2021.05.25.21257828',
  articleTitle: 'Correlation of the commercial anti-SARS-CoV-2 receptor binding domain antibody test with the chemiluminescent reduction neutralizing test and possible detection of antibodies to emerging variants',
  date: new Date('2021-05-29'),
  groupId: '8ccea9c2-e6c8-4dd7-bf1d-37c3fa86ff65',
  groupName: 'ScreenIT',
  avatarPath: '/static/groups/screenit--8ccea9c2-e6c8-4dd7-bf1d-37c3fa86ff65.jpg',
};

const card3: Card = {
  articleId: '10.1101/2021.05.13.21256639',
  articleTitle: 'Efficacy of the NVX-CoV2373 Covid-19 Vaccine Against the B.1.1.7 Variant',
  date: new Date('2021-05-28'),
  groupId: '62f9b0d0-8d43-4766-a52a-ce02af61bc6a',
  groupName: 'NCRC',
  avatarPath: '/static/groups/ncrc--62f9b0d0-8d43-4766-a52a-ce02af61bc6a.jpg',
};

const renderCard = (card: Card) => `
  <article class="landing-page-card">
    <h3 class="landing-page-card__title">
      <a class="landing-page-card__link" href="/articles/activity/${card.articleId}">${card.articleTitle}</a>
    </h3>
    <p class="landing-page-card__group">
      <img class="landing-page-card__avatar" src="${card.avatarPath}" alt="" />
      <span>Evaluated by <a href="/groups/${card.groupId}">${card.groupName}</a></span>
    </p>
    <div class="landing-page-card__meta">
      ${templateDate(card.date)}
    </div>
  </article>
`;

export const recentlyEvaluated = toHtmlFragment(`
  <section class="landing-page-recently-evaluated">
    <h2 class="landing-page-recently-evaluated__title">Recently evaluated by groups on Sciety</h2>
    <ul class="landing-page-recently-evaluated__articles">
      <li>
        ${renderCard(card1)}
      </li>
      <li>
        ${renderCard(card2)}
      </li>
      <li>
        ${renderCard(card3)}
      </li>
    </ul>
    <div class="landing-page-recently-evaluated__call_to_action">
      <a href="/groups" class="landing-page-recently-evaluated__button">Discover more groups</a>
    </div>
  </section>
`);
