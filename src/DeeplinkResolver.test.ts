import {DeeplinkResolver} from './DeeplinkConsumer';
import axios from 'axios';
import {HostMappingCache} from './HostMappingCache';

jest.mock('axios');
jest.mock('./HostMappingCache');

describe('DeeplinkResolver', () => {
  describe('Unit Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create an instance with deeplink', () => {
      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);
      expect(resolver).toBeInstanceOf(DeeplinkResolver);
    });

    it('should correctly parse resolver and UUID from deeplink', async () => {
      const mockMappingData = {resolver: 'mapped.host'};
      const mockTemplate = {type: 'object'};

      const mockHostMappingCache = {
        getResolverHost: jest.fn().mockResolvedValue('mapped.host'),
      };

      (HostMappingCache.getInstance as jest.Mock).mockReturnValue(
        mockHostMappingCache,
      );
      (axios.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockTemplate,
      });

      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);
      await resolver.fetchUsecase();

      expect(axios.get).toHaveBeenCalledWith(
        'https://mapped.host/api/resolver/12345',
      );
    });

    it('should throw error when resolver API returns non-200 status', async () => {
      const mockHostMappingCache = {
        getResolverHost: jest.fn().mockResolvedValue('mapped.host'),
      };

      (HostMappingCache.getInstance as jest.Mock).mockReturnValue(
        mockHostMappingCache,
      );
      (axios.get as jest.Mock).mockResolvedValue({status: 404});

      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);

      await expect(resolver.fetchUsecase()).rejects.toThrow(
        'Error fetching usecase template',
      );
    });
  });

  describe('Integration Tests', () => {
    it('should successfully fetch and return usecase template', async () => {
      const mockTemplate = {
        type: 'object',
        properties: {
          context: {type: 'object'},
          message: {
            type: 'object',
            properties: {
              data: {type: 'string'},
            },
          },
        },
      };

      const mockHostMappingCache = {
        getResolverHost: jest.fn().mockResolvedValue('mapped.host'),
      };

      (HostMappingCache.getInstance as jest.Mock).mockReturnValue(
        mockHostMappingCache,
      );
      (axios.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockTemplate,
      });

      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);
      const result = await resolver.fetchUsecase();

      expect(result).toEqual(mockTemplate);
      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
      expect(result.properties?.context).toBeDefined();
    });

    it('should handle complex deeplink structures', async () => {
      const mockTemplate = {type: 'object'};
      const mockHostMappingCache = {
        getResolverHost: jest.fn().mockResolvedValue('mapped.host'),
      };

      (HostMappingCache.getInstance as jest.Mock).mockReturnValue(
        mockHostMappingCache,
      );
      (axios.get as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockTemplate,
      });

      const deeplink = 'beckn://sub.resolver.beckn.org/12345-6789-0000';
      const resolver = new DeeplinkResolver(deeplink);
      const result = await resolver.fetchUsecase();

      expect(result).toBeDefined();
      expect(axios.get).toHaveBeenCalledWith(
        'https://mapped.host/api/resolver/12345-6789-0000',
      );
    });
  });
});
