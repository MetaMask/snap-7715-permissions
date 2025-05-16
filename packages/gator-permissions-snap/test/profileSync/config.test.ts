import { getProfileSyncSdkEnv } from '../../src/profileSync';

describe('config', () => {
  describe('getProfileSyncSdkEnv', () => {
    it('should return the correct storage environment for when snap run locally', async () => {
      const res = getProfileSyncSdkEnv('local');
      expect(res).toBe('dev');
    });

    it('should return the correct storage environment for when snap run production', async () => {
      const res = getProfileSyncSdkEnv('production');
      expect(res).toBe('prd');
    });
    it('should return dev if the snap env is not local or production', async () => {
      const res = getProfileSyncSdkEnv('not-local-or-production');
      expect(res).toBe('dev');
    });

    it('should return dev if the snap env is not provided', async () => {
      const res = getProfileSyncSdkEnv(undefined);
      expect(res).toBe('dev');
    });
  });
});
