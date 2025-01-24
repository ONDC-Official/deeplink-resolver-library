import * as yaml from 'js-yaml';
import * as fs from 'fs';
import axios from 'axios';

export type JsonSchemaObject = {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $comment?: string;
  type:
    | 'object'
    | 'array'
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'null';
  properties?: {
    [key: string]: JsonSchemaObject;
  };
  items?: JsonSchemaObject;
  required?: string[];
  additionalProperties?: boolean;
  oneOf?: Array<string | number | boolean | {const: string; title: string}>;
  const?: string;
};

export class DeeplinkResolver {
  constructor(private deeplink: string) {}
  async fetchUsecase(): Promise<JsonSchemaObject> {
    const resolver = this.deeplink.split('://')[1].split('/')[0];
    const resolverHost = resolver
      .split('.')
      .slice(0, resolver.split('.').length - 2)
      .join('.');
    const uuid = this.deeplink.split('://')[1].split('/')[1];
    const res = await axios.get(`https://${resolverHost}/api/resolver/${uuid}`);
    if (res.status !== 200) {
      throw new Error('Error fetching usecase template');
    }
    return res.data as JsonSchemaObject;
  }
}
