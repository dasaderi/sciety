import { projectHasUserSavedArticle } from '../../src/article-page/project-has-user-saved-article';
import Doi from '../../src/types/doi';
import toUserId from '../../src/types/user-id';

describe('project-has-user-saved-article', () => {
  describe('when the user has saved the article', () => {
    it('returns true', async () => {
      const result = await projectHasUserSavedArticle(
        new Doi('10.1101/2020.07.04.187583'),
        toUserId('1295307136415735808'),
      )();

      expect(result).toBe(true);
    });
  });

  describe('when the user has not saved the article', () => {
    it('returns false', async () => {
      const result = await projectHasUserSavedArticle(
        new Doi('10.1101/some-doi'),
        toUserId('the-user'),
      )();

      expect(result).toBe(false);
    });
  });

  describe('when the user has saved another article', () => {
    it('returns false', async () => {
      const result = await projectHasUserSavedArticle(
        new Doi('10.1101/some-doi'),
        toUserId('1295307136415735808'),
      )();

      expect(result).toBe(false);
    });
  });

  describe('when another user has saved this article', () => {
    it('returns false', async () => {
      const result = await projectHasUserSavedArticle(
        new Doi('10.1101/2020.07.04.187583'),
        toUserId('the-user'),
      )();

      expect(result).toBe(false);
    });
  });
});
