import {DeeplinkResolver} from './DeeplinkResolver';
import axios from 'axios';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

jest.mock('axios');
jest.mock('fs');
jest.mock('js-yaml');

const mockYamlData = {
  'context.bap_id': 'test',
  'context.bap_uri': 'something-something',
};

const mockUsecaseTemplate = {
  context: {
    ttl: 'PT30S',
    city: 'std:011',
    action: 'search',
    bap_id: '{{context.bap_id}}',
    domain: 'ONDC:RET10',
    bap_uri: '{{context.bap_uri}}',
    country: 'IND',
    timestamp: '{{context.timestamp}}',
    message_id: '{{context.message_id}}',
    core_version: '1.2.0',
    transaction_id: '{{context.transaction_id}}',
  },
  message: {
    intent: {
      payment: {
        '@ondc/org/buyer_app_finder_fee_type': 'percent',
        '@ondc/org/buyer_app_finder_fee_amount': 5,
      },
    },
  },
};

const expectedResolvedData = {
  context: {
    ttl: 'PT30S',
    city: 'std:011',
    action: 'search',
    bap_id: 'test',
    domain: 'ONDC:RET10',
    bap_uri: 'something-something',
    country: 'IND',
    timestamp: '{{context.timestamp}}',
    message_id: '{{context.message_id}}',
    core_version: '1.2.0',
    transaction_id: '{{context.transaction_id}}',
  },
  message: {
    intent: {
      payment: {
        '@ondc/org/buyer_app_finder_fee_type': 'percent',
        '@ondc/org/buyer_app_finder_fee_amount': 5,
      },
    },
  },
};

describe('DeeplinkResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (yaml.load as jest.Mock).mockReturnValue(mockYamlData);
    (axios.get as jest.Mock).mockResolvedValue({data: mockUsecaseTemplate});
  });

  it('should load YAML file correctly', async () => {
    const resolver = new DeeplinkResolver(
      './mock/test_config.yaml',
      '7456d7b1-e719-45',
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(
      './mock/test_config.yaml',
      'utf8',
    );
    expect(yaml.load).toHaveBeenCalled();
  });

  it('should fetch usecase template successfully', async () => {
    const resolver = new DeeplinkResolver(
      './mock/test_config.yaml',
      '7456d7b1-e719-45',
    );
    const result = await resolver.resolve();

    expect(axios.get).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/ONDC-Official/deeplink-resolver-storage/refs/heads/master/deep-link-payload/json/7456d7b1-e719-45.json',
    );
    expect(result).toEqual(expectedResolvedData);
  });

  it('should handle YAML loading errors', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() => {
      new DeeplinkResolver('invalid/path.yaml', 'test-usecase');
    }).toThrow('Error loading YAML file: File not found');
  });

  it('should handle API errors', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));
    const resolver = new DeeplinkResolver(
      './mock/test_config.yaml',
      'impossible-value',
    );

    await expect(resolver.resolve()).rejects.toThrow(
      'Error fetching usecase template: API error',
    );
  });
});
