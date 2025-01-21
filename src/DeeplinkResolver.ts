import * as yaml from 'js-yaml';
import * as fs from 'fs';
import axios from 'axios';

const RESOLVER_API = 'https://deeplink.resolver.ondc.org/api/resolver';

type DynamicResolver = {
  path: string;
  resolver: (() => Promise<string>) | string;
};
export class DeeplinkResolver {
  private staticData: Record<string, any>;
  private usecaseTemplate: Record<string, any>;
  private dynamicResolvers: DynamicResolver[] = [];

  constructor(
    yamlPath: string,
    private usecaseId: string,
  ) {
    this.staticData = this.loadYamlFile(yamlPath);
  }

  private loadYamlFile(path: string): Record<string, any> {
    try {
      const fileContents = fs.readFileSync(path, 'utf8');
      return yaml.load(fileContents) as Record<string, any>;
    } catch (error) {
      throw new Error(`Error loading YAML file: ${error.message}`);
    }
  }

  private async fetchUsecaseTemplate(): Promise<void> {
    try {
      const response = await axios.get(
        `${RESOLVER_API}/${this.usecaseId}.json`,
      );
      this.usecaseTemplate = response.data;
    } catch (error) {
      throw new Error(`Error fetching usecase template: ${error.message}`);
    }
  }

  private replaceStaticValues(obj: any): any {
    if (typeof obj === 'string') {
      const matches = obj.match(/{{(.+?)}}/g);
      if (matches) {
        let result = obj;
        matches.forEach(match => {
          const key = match.replace(/{{|}}/g, '');
          if (this.staticData[key]) {
            result = result.replace(match, this.staticData[key]);
          }
        });
        return result;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceStaticValues(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      for (const key in obj) {
        result[key] = this.replaceStaticValues(obj[key]);
      }
      return result;
    }

    return obj;
  }

  public async staticResolve(): Promise<Record<string, any>> {
    await this.fetchUsecaseTemplate();
    return this.replaceStaticValues(this.usecaseTemplate);
  }
  public addDynamicResolver(
    path: string,
    resolver: (() => Promise<string>) | string,
  ) {
    this.dynamicResolvers.push({path, resolver});
  }
  public async dynamicResolve(): Promise<Record<string, any>> {
    await this.fetchUsecaseTemplate();
    const resolvedTemplate = {...this.usecaseTemplate};

    for (const {path, resolver} of this.dynamicResolvers) {
      let value: string;

      if (typeof resolver === 'string') {
        // If resolver is an API URL
        const response = await axios.get(resolver);
        value = response.data;
      } else {
        // If resolver is a function
        value = await resolver();
      }

      // Navigate and update the nested path
      const pathParts = path.split('.');
      let current = resolvedTemplate;

      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }

      current[pathParts[pathParts.length - 1]] = value;
    }

    // Apply static resolvers after dynamic ones
    return this.replaceStaticValues(resolvedTemplate);
  }
}
