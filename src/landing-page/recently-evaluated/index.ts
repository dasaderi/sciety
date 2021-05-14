import { templateDate } from '../../shared-components/date';
import { toHtmlFragment } from '../../types/html-fragment';

type Card = {
  articleId: string,
  articleTitle: string,
  date: Date,
  groupId: string,
  groupName: string,
};

const card1: Card = {
  articleId: '10.1101/2021.01.10.426076',
  articleTitle: 'Single-cell RNA-seq analysis reveals penaeid shrimp hemocyte subpopulations and cell differentiation process',
  date: new Date('2021-05-12'),
  groupId: 'b560187e-f2fb-4ff9-a861-a204f3fc0fb0',
  groupName: 'eLife',
};

const card2: Card = {
  articleId: '10.1101/2021.02.20.20248421',
  articleTitle: 'Nosocomial outbreak of SARS-CoV-2 in a “non-COVID-19” hospital ward: virus genome sequencing as a key tool to understand cryptic transmission',
  date: new Date('2021-04-22'),
  groupId: '62f9b0d0-8d43-4766-a52a-ce02af61bc6a',
  groupName: 'NCRC',
};

const card3: Card = {
  articleId: '10.1101/2021.04.12.439490',
  articleTitle: 'Design, Synthesis and Evaluation of WD-repeat containing protein 5 (WDR5) degraders',
  date: new Date('2021-05-10'),
  groupId: '10360d97-bf52-4aef-b2fa-2f60d319edd7',
  groupName: 'PREreview',
};

const renderCard1 = (card: Card) => `
  <article class="article-card landing-page-card">
    <h3 class="article-card__title landing-page-card__title">
      <a class="article-card__link" href="/articles/activity/${card.articleId}?utm_source=landingpage&utm_medium=banner&utm_campaign=recently-evaluated-1">${card.articleTitle}</a>
    </h3>
    <p class="landing-page-card__group">
      <img class="group-card__avatar landing-page-card__avatar" src="/static/groups/elife--b560187e-f2fb-4ff9-a861-a204f3fc0fb0.png" alt="" />
      <span>Evaluated by <a href="/groups/${card.groupId}">${card.groupName}</a></span>
    </p>
    <div class="article-card__meta landing-page-card__meta">
      ${templateDate(card.date)}
    </div>
  </article>
`;

const renderCard2 = (card: Card) => `
  <article class="article-card landing-page-card">
    <h3 class="article-card__title landing-page-card__title">
      <a class="article-card__link" href="/articles/activity/${card.articleId}?utm_source=landingpage&utm_medium=banner&utm_campaign=recently-evaluated-2">${card.articleTitle}</a>
    </h3>
    <p class="landing-page-card__group">
      <img class="group-card__avatar landing-page-card__avatar" src="/static/groups/ncrc--62f9b0d0-8d43-4766-a52a-ce02af61bc6a.jpg" alt="" />
      <span>Evaluated by <a href="/groups/${card.groupId}">${card.groupName}</a></span>
    </p>
    <div class="article-card__meta landing-page-card__meta">
      ${templateDate(card.date)}
    </div>
  </article>
`;

const renderCard3 = (card: Card) => `
  <article class="article-card landing-page-card">
    <h3 class="article-card__title landing-page-card__title">
      <a class="article-card__link" href="/articles/activity/${card.articleId}?utm_source=landingpage&utm_medium=banner&utm_campaign=recently-evaluated-3">${card.articleTitle}</a>
    </h3>
    <p class="landing-page-card__group">
      <img class="group-card__avatar landing-page-card__avatar" src="/static/groups/prereview-community--10360d97-bf52-4aef-b2fa-2f60d319edd7.jpg" alt="" />
      <span>Evaluated by <a href="/groups/${card.groupId}">${card.groupName}</a></span>
    </p>
    <div class="article-card__meta landing-page-card__meta">
      ${templateDate(card.date)}
    </div>
  </article>
`;

export const recentlyEvaluated = toHtmlFragment(`
  <section class="landing-page-recently-evaluated">
    <h2 class="landing-page-recently-evaluated__title">Recently evaluated by groups on Sciety</h2>
    <ul class="landing-page-recently-evaluated__articles">
      <li>
        ${renderCard1(card1)}
      </li>
      <li>
        ${renderCard2(card2)}
      </li>
      <li>
        ${renderCard3(card3)}
      </li>
    </ul>
    <div class="landing-page-recently-evaluated__call_to_action">
      <a href="/groups" class="landing-page__secondary_button">Discover more groups</a>
    </div>
  </section>
`);
