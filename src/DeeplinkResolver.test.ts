import {DeeplinkResolver} from './DeeplinkResolver';
import axios from 'axios';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

jest.mock('axios');
jest.mock('fs');
jest.mock('js-yaml');

describe('DeeplinkResolver Unit Tests', () => {
  const mockYamlData = {
    'context.bap_id': 'test-bap',
    'context.bap_uri': 'https://test-bap.com',
    'context.domain': 'retail',
  };

  const mockUsecaseTemplate = {
    context: {
      bap_id: '{{context.bap_id}}',
      bap_uri: '{{context.bap_uri}}',
      domain: '{{context.domain}}',
    },
    message: {
      intent: {
        category: {
          id: 'fruits',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (yaml.load as jest.Mock).mockReturnValue(mockYamlData);
    (axios.get as jest.Mock).mockResolvedValue({data: mockUsecaseTemplate});
  });

  it('should initialize with yaml config', () => {
    const resolver = new DeeplinkResolver('./config.yaml', 'test-usecase');
    expect(fs.readFileSync).toHaveBeenCalledWith('./config.yaml', 'utf8');
    expect(yaml.load).toHaveBeenCalled();
  });

  it('should resolve static values correctly', async () => {
    const resolver = new DeeplinkResolver('./config.yaml', 'test-usecase');
    const result = await resolver.staticResolve();

    expect(result.context).toEqual({
      bap_id: 'test-bap',
      bap_uri: 'https://test-bap.com',
      domain: 'retail',
    });
  });

  it('should handle dynamic resolvers with functions', async () => {
    const resolver = new DeeplinkResolver('./config.yaml', 'test-usecase');
    const mockTimestamp = '2023-01-01T00:00:00.000Z';

    resolver.addDynamicResolver('context.timestamp', async () => mockTimestamp);

    const result = await resolver.dynamicResolve();
    expect(result.context.timestamp).toBe(mockTimestamp);
  });

  it('should handle dynamic resolvers with API URLs', async () => {
    const resolver = new DeeplinkResolver('./config.yaml', 'test-usecase');
    const mockApiUrl = 'https://api.example.com/data';
    const mockApiResponse = {data: 'test-data'};

    (axios.get as jest.Mock).mockImplementation(url => {
      if (url === mockApiUrl) {
        return Promise.resolve({data: 'dynamic-value'});
      }
      return Promise.resolve({data: mockUsecaseTemplate});
    });

    resolver.addDynamicResolver('message.intent.category.id', mockApiUrl);

    const result = await resolver.dynamicResolve();
    expect(result.message.intent.category.id).toBe('dynamic-value');
  });
});

describe('DeeplinkResolver Integration Tests', () => {
  const realConfigPath = path.join(__dirname, '../config/real-config.yaml');

  it('should handle complete resolution flow', async () => {
    const resolver = new DeeplinkResolver(realConfigPath, 'retail-search');

    // Mock the template response to avoid recursion
    (axios.get as jest.Mock).mockImplementation(url => {
      return Promise.resolve({
        data: {
          context: {
            timestamp: '',
            transaction_id: '',
            bap_id: '{{context.bap_id}}',
          },
        },
      });
    });

    resolver.addDynamicResolver(
      'context.timestamp',
      async () => '2023-01-01T00:00:00Z',
    );
    resolver.addDynamicResolver(
      'context.transaction_id',
      'https://api.example.com/transaction',
    );

    const result = await resolver.dynamicResolve();
    expect(result).toHaveProperty('context');
  });

  it('should handle error cases gracefully', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const resolver = new DeeplinkResolver(realConfigPath, 'invalid-usecase');

    await expect(resolver.staticResolve()).rejects.toThrow(
      'Error fetching usecase template',
    );
  });

  it('should combine static and dynamic resolvers correctly', async () => {
    const resolver = new DeeplinkResolver('./config.yaml', 'test-usecase');

    // Reset axios mock for this test
    (axios.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          context: {bap_id: '{{context.bap_id}}'},
          message: {intent: {category: {id: 'placeholder'}}},
        },
      }),
    );

    const mockDynamicValue = 'dynamic-test-value';
    resolver.addDynamicResolver(
      'message.intent.category.id',
      async () => mockDynamicValue,
    );

    const result = await resolver.dynamicResolve();
    expect(result.context.bap_id).toBe('test-bap');
    expect(result.message.intent.category.id).toBe(mockDynamicValue);
  });
});
