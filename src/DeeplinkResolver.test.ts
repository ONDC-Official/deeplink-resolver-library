import {DeeplinkResolver} from './DeeplinkConsumer';
import axios from 'axios';

jest.mock('axios');

describe('DeeplinkResolver', () => {
  // Unit Tests
  describe('Unit Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create an instance with deeplink', () => {
      const deeplink = 'beckn://resolver.beckn.org.ret.mock/12345';
      const resolver = new DeeplinkResolver(deeplink);
      expect(resolver).toBeInstanceOf(DeeplinkResolver);
    });

    it('should fetch usecase template successfully', async () => {
      const mockTemplate = {
        type: 'object',
        properties: {
          context: {
            type: 'object',
          },
        },
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockTemplate,
      });

      const deeplink = 'beckn://resolver.beckn.org.ret.mock/12345';
      const resolver = new DeeplinkResolver(deeplink);
      const result = await resolver.fetchUsecase();

      expect(axios.get).toHaveBeenCalledWith(
        'https://resolver.beckn.org/api/resolver/12345',
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should throw error when API returns non-200 status', async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 404,
      });

      const deeplink = 'beckn://resolver.beckn.org.ret.mock/12345';
      const resolver = new DeeplinkResolver(deeplink);

      await expect(resolver.fetchUsecase()).rejects.toThrow(
        'Error fetching usecase template',
      );
    });

    it('should correctly parse complex deeplinks', async () => {
      const mockTemplate = {type: 'object'};
      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockTemplate,
      });

      const deeplink = 'beckn://custom.resolver.beckn.org.ret.mock/abc-123-xyz';
      const resolver = new DeeplinkResolver(deeplink);
      await resolver.fetchUsecase();

      expect(axios.get).toHaveBeenCalledWith(
        'https://custom.resolver.beckn.org/api/resolver/abc-123-xyz',
      );
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should handle complete flow with real schema response', async () => {
      const mockSchema = {
        type: 'object',
        properties: {
          context: {
            type: 'object',
            properties: {
              domain: {type: 'string'},
              action: {type: 'string'},
              version: {type: 'string'},
            },
          },
          message: {
            type: 'object',
            properties: {
              intent: {type: 'object'},
            },
          },
        },
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockSchema,
      });

      const deeplink = 'beckn://resolver.beckn.org.ret.mock/12345';
      const resolver = new DeeplinkResolver(deeplink);
      const result = await resolver.fetchUsecase();

      expect(result).toEqual(mockSchema);
      expect(result.type).toBe('object');
      expect(result.properties?.context).toBeDefined();
      expect(result.properties?.message).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      const deeplink = 'beckn://resolver.beckn.org.ret.mock/12345';
      const resolver = new DeeplinkResolver(deeplink);

      await expect(resolver.fetchUsecase()).rejects.toThrow();
    });
  });
});
