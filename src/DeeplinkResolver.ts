import * as yaml from 'js-yaml';
import * as fs from 'fs';
import axios from 'axios';

// const RESOLVER_API = 'https://deeplink.resolver.ondc.org/api/resolver';
const RESOLVER_API =
  'https://raw.githubusercontent.com/ONDC-Official/deeplink-resolver-storage/refs/heads/master/deep-link-payload/json';

export class DeeplinkResolver {
  private staticData: Record<string, any>;
  private usecaseTemplate: Record<string, any>;

  constructor(
    yamlPath: string,
    private usecaseId: string,
  ) {
    this.staticData = this.loadYamlFile(yamlPath);
  }

  private loadYamlFile(path: string): Record<string, any> {
    try {
      console.log('OPENING FILE at path:::', path);
      const fileContents = fs.readFileSync(path, 'utf8');
      console.log('FILE CONTENTS :::', fileContents);
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

  public async resolve(): Promise<Record<string, any>> {
    await this.fetchUsecaseTemplate();
    return this.replaceStaticValues(this.usecaseTemplate);
  }
}
