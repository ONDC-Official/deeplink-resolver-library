import axios from 'axios';

export class HostMappingCache {
  private static instance: HostMappingCache;
  private static resolverHostMappingUrl = 'www.google.com'; // CHANGE THIS
  private cache: Record<string, string> | null = null;

  private constructor() {}

  static getInstance(): HostMappingCache {
    if (!HostMappingCache.instance) {
      HostMappingCache.instance = new HostMappingCache();
    }
    return HostMappingCache.instance;
  }

  public static setMappingUrl(url: string): void {
    HostMappingCache.resolverHostMappingUrl = url;
  }

  async getMapping(url: string): Promise<Record<string, string>> {
    if (!this.cache) {
      const response = await axios.get(url);
      if (response.status === 200) {
        this.cache = response.data;
      } else {
        throw new Error('Failed to fetch mapping data');
      }
    }
    return this.cache;
  }

  async getResolverHost(deeplinkHost: string): Promise<string> {
    this.cache = await this.getMapping(HostMappingCache.resolverHostMappingUrl);
    return this.cache[deeplinkHost];
  }
}
