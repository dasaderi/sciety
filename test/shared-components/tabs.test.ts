import { JSDOM } from 'jsdom';
import { tabs } from '../../src/shared-components/tabs';
import { arbitraryHtmlFragment, arbitraryString, arbitraryUri } from '../helpers';

describe('tabs', () => {
  it('shows an active tab label', () => {
    const tabLabel = arbitraryString();
    const rendered = JSDOM.fragment(tabs(arbitraryHtmlFragment(), arbitraryUri(), tabLabel));
    const activeTab = rendered.querySelector('[role=tab][aria-selected=true]');

    expect(activeTab?.textContent).toStrictEqual(tabLabel);
  });

  it('active tab is not a link', () => {
    const rendered = JSDOM.fragment(tabs(arbitraryHtmlFragment(), arbitraryUri(), arbitraryString()));
    const activeTab = rendered.querySelector('[role=tab][aria-selected=true]');

    expect(activeTab?.tagName).not.toStrictEqual('A');
  });

  it('shows inactive tab as link', () => {
    const rendered = JSDOM.fragment(tabs(arbitraryHtmlFragment(), arbitraryUri(), arbitraryString()));
    const inactiveTab = rendered.querySelector('[role="tab"]:not([aria-selected=true])');

    expect(inactiveTab?.tagName).toStrictEqual('A');
  });

  it.todo('orders tabs independently of active state');

  it('shows the content in the tab panel', () => {
    const content = arbitraryHtmlFragment();
    const rendered = JSDOM.fragment(tabs(content, arbitraryUri(), arbitraryString()));
    const tabPanelContent = rendered.querySelector('[role="tabpanel"]');

    expect(tabPanelContent?.innerHTML.trim()).toStrictEqual(content);
  });
});
