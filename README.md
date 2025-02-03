# Deeplink Resolver Library

A TypeScript library for resolving BECKN protocol deeplinks, developed for ONDC (Open Network for Digital Commerce).

## Authors
- Abhik Banerjee
- Sonali Shakya

## Features
- Resolves BECKN protocol deeplinks (beckn://) to their corresponding API endpoints
- Implements singleton pattern for efficient host mapping cache
- Configurable resolver host mapping via external JSON configuration
- Promise-based async operations for API calls
- Built with TypeScript for type safety

## Installation

```bash
npm install @ondc/deeplink-resolver
```

## Usage

### Basic Usage

```typescript
import { DeeplinkResolver } from 'deeplink-resolver-library';

const deeplink = 'beckn://resolver.beckn.org/12345';
const resolver = new DeeplinkResolver(deeplink);

// Fetch usecase template
const template = await resolver.fetchUsecase();
```
### Custom Mapping Configuration
```typescript
import { HostMappingCache } from 'deeplink-resolver-library';

// Set custom mapping URL
HostMappingCache.setMappingUrl('https://your-custom-mapping-url.json');
```
## API Reference

### DeeplinkResolver

- Constructor: new DeeplinkResolver(deeplink: string)
- Methods:
  - fetchUsecase(): Fetches the usecase template for the given deeplink

## Authors and Contributors
Author:
- [Abhik Banerjee](https://github.com/abhik-wil)
- [Sonali Shakya](https://github.com/sonalishakya)