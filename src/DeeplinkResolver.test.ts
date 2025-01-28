import {DeeplinkResolver} from './DeeplinkConsumer';
import axios from 'axios';

jest.mock('axios');

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

    it('should set mapping URL correctly', () => {
      const newUrl = 'https://example.com/mapping';
      DeeplinkResolver.setMappingUrl(newUrl);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should fetch usecase template successfully', async () => {
      const mockMappingData = {'resolver.beckn.org': 'mapped.host'};
      const mockTemplate = {
        type: 'object',
        properties: {
          context: {type: 'object'},
        },
      };

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({status: 200, data: mockMappingData})
        .mockResolvedValueOnce({status: 200, data: mockTemplate});

      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);
      const result = await resolver.fetchUsecase();

      expect(result).toEqual(mockTemplate);
    });

    it('should throw error when mapping API fails', async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({status: 500});

      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);

      await expect(resolver.fetchUsecase()).rejects.toThrow(
        'Failed to fetch mapping data',
      );
    });

    it('should throw error when resolver API returns non-200 status', async () => {
      const mockMappingData = {'resolver.beckn.org': 'mapped.host'};

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({status: 200, data: mockMappingData})
        .mockResolvedValueOnce({status: 404});

      const deeplink = 'beckn://resolver.beckn.org/12345';
      const resolver = new DeeplinkResolver(deeplink);

      await expect(resolver.fetchUsecase()).rejects.toThrow(
        'Error fetching usecase template',
      );
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle complete flow with real-like data', async () => {
      const mockMappingData = {
        'resolver.beckn.org': 'api.beckn.org',
      };

      const mockTemplate = {
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

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({status: 200, data: mockMappingData})
        .mockResolvedValueOnce({status: 200, data: mockTemplate});

      const deeplink = 'beckn://resolver.beckn.org/template-123';
      const resolver = new DeeplinkResolver(deeplink);
      const result = await resolver.fetchUsecase();

      expect(result).toEqual(mockTemplate);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple requests using same mapping data', async () => {
      const mockMappingData = {
        'resolver.beckn.org': 'api.beckn.org',
      };

      const mockTemplate = {
        type: 'object',
        properties: {test: {type: 'string'}},
      };

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({status: 200, data: mockMappingData})
        .mockResolvedValueOnce({status: 200, data: mockTemplate})
        .mockResolvedValueOnce({status: 200, data: mockTemplate});

      const resolver1 = new DeeplinkResolver('beckn://resolver.beckn.org/123');
      const resolver2 = new DeeplinkResolver('beckn://resolver.beckn.org/456');

      const result1 = await resolver1.fetchUsecase();
      const result2 = await resolver2.fetchUsecase();

      expect(result1).toEqual(mockTemplate);
      expect(result2).toEqual(mockTemplate);
      // Mapping should only be fetched once
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });
});
