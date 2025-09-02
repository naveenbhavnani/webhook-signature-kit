# webhook-signature-kit

A tiny, framework-friendly TypeScript library that verifies webhook signatures correctly for popular providers and a configurable Generic-HMAC profile. It also solves the #1 pain point: getting the exact raw body across Express/Fastify/Next.js/Lambda/Workers.

## Features

- **Correctness first**: Raw bytes, constant-time compare, header parsing edge cases, tolerance windows
- **No heavy deps**: Node crypto, tiny utils; optional adapters (Redis) behind separate entrypoints
- **Framework-friendly**: Express, Fastify, Next.js (pages & app router), AWS Lambda/API Gateway, Cloudflare Workers
- **Great DX**: Clear errors (machine + human), typed results, small surface area
- **Security**: Constant-time comparisons, replay protection, key rotation support

## Supported Providers

- **stripe** — `Stripe-Signature` (HMAC-SHA256 over `"${t}.${rawBody}"`, tolerance window)
- **slack** — `X-Slack-Signature: v0=...`, `X-Slack-Request-Timestamp` (HMAC-SHA256 over `v0:${ts}:${rawBody}`)
- **github** — `X-Hub-Signature-256: sha256=...` (preferred); optional legacy `X-Hub-Signature: sha1=...`
- **razorpay** — `X-Razorpay-Signature` (HMAC-SHA256 over raw body; base64 digest)
- **shopify** — `X-Shopify-Hmac-Sha256` (HMAC-SHA256 over raw body; base64 digest)
- **twilio** — `X-Twilio-Signature` (HMAC-SHA1 over URL + params or URL + raw body for JSON)
- **gitlab** — `X-Gitlab-Token` (shared secret equality)
- **generic-hmac** — configurable header/algorithm/encoding/prefixes

## Installation

```bash
npm install webhook-signature-kit
```

## Quick Start

### Basic Usage

```typescript
import { verifyWebhook } from 'webhook-signature-kit';

const result = await verifyWebhook({
  provider: 'stripe',
  secret: process.env.STRIPE_ENDPOINT_SECRET!,
  headers: req.headers,
  rawBody: req.rawBody // IMPORTANT: Must be raw bytes, not parsed JSON
});

if (!result.ok) {
  return res.status(401).json(result);
}

// Safe to parse JSON now
const event = JSON.parse(req.rawBody.toString('utf8'));
```

### Express

```typescript
import express from 'express';
import { expressMiddleware } from 'webhook-signature-kit/express';

const app = express();

// IMPORTANT: Capture raw body BEFORE JSON parsing
app.use(express.json({ 
  verify: (req, _res, buf) => { 
    (req as any).rawBody = Buffer.from(buf); 
  } 
}));

app.post('/stripe', expressMiddleware({ 
  provider: 'stripe', 
  secret: process.env.STRIPE_ENDPOINT_SECRET!,
  onVerified: ({ req }) => {
    console.log('Webhook verified!', req.body);
  }
}));
```

### Fastify

```typescript
import Fastify from 'fastify';
import { fastifyPlugin } from 'webhook-signature-kit/fastify';

const app = Fastify({ logger: true });

// Register raw body plugin
await app.register(require('fastify-raw-body'), {
  field: 'rawBody',
  global: true,
  encoding: 'utf8',
  runFirst: true
});

await app.register(fastifyPlugin, {
  provider: 'slack',
  secret: process.env.SLACK_SIGNING_SECRET!
});
```

### Next.js (App Router)

```typescript
// app/api/webhooks/stripe/route.ts
import { verifyWebhook } from 'webhook-signature-kit';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  const result = await verifyWebhook({
    provider: 'stripe',
    secret: process.env.STRIPE_ENDPOINT_SECRET!,
    headers,
    rawBody
  });

  if (!result.ok) {
    return new Response(JSON.stringify(result), { status: 401 });
  }

  return new Response('ok');
}
```

### Next.js (Pages API)

```typescript
// pages/api/webhooks/github.ts
import { nextVerify } from 'webhook-signature-kit/next';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const result = await nextVerify(req, res, {
    provider: 'github',
    secret: process.env.GITHUB_WEBHOOK_SECRET!
  });

  if (!result.ok) {
    return res.status(401).json(result);
  }

  return res.status(200).end('ok');
}
```

### AWS Lambda

```typescript
import { awsLambdaVerify } from 'webhook-signature-kit/aws';

export const handler = async (event) => {
  const result = await awsLambdaVerify(event, {
    provider: 'github',
    secret: process.env.GITHUB_WEBHOOK_SECRET!
  });

  return {
    statusCode: result.ok ? 200 : 401,
    body: result.ok ? 'ok' : JSON.stringify(result)
  };
};
```

### Cloudflare Workers

```typescript
import { cfVerify } from 'webhook-signature-kit/cf';

export default {
  async fetch(request: Request) {
    const result = await cfVerify(request, {
      provider: 'shopify',
      secret: SHOPIFY_SECRET // Environment variable
    });

    return new Response(
      result.ok ? 'ok' : JSON.stringify(result),
      { status: result.ok ? 200 : 401 }
    );
  }
};
```

## Advanced Usage

### Key Rotation

```typescript
const result = await verifyWebhook({
  provider: 'stripe',
  secret: [oldSecret, newSecret], // Try both secrets
  headers: req.headers,
  rawBody: req.rawBody
});
```

### Replay Protection

```typescript
import { MemoryReplayStore } from 'webhook-signature-kit/replay-memory';
// or
import { RedisReplayStore } from 'webhook-signature-kit/replay-redis';

const replayStore = new MemoryReplayStore();
// const replayStore = new RedisReplayStore(redisClient);

const result = await verifyWebhook({
  provider: 'stripe',
  secret: process.env.STRIPE_ENDPOINT_SECRET!,
  headers: req.headers,
  rawBody: req.rawBody,
  replayStore,
  tolerance: 300 // 5 minutes
});
```

### Generic HMAC

```typescript
const result = await verifyWebhook({
  provider: 'generic-hmac',
  config: {
    secret: 'your-hmac-secret',
    header: 'X-Custom-Signature',
    algo: 'sha256',
    format: { 
      enc: 'hex',
      prefix: 'sha256=',
      caseInsensitive: false 
    },
    payload: 'raw-body'
  },
  headers: req.headers,
  rawBody: req.rawBody
});
```

## Error Handling

All verification functions return a `VerifyResult` object:

```typescript
interface VerifyResult {
  ok: boolean;
  reason?: 'missing_header' | 'bad_header' | 'bad_signature' | 
           'timestamp_out_of_tolerance' | 'body_unavailable' | 
           'secret_unavailable' | 'unsupported_provider' | 
           'replay_detected';
  message?: string;
  meta?: any; // Provider-specific metadata
}
```

## Raw Body Capture

The most common issue is not capturing the raw request body correctly. Here are recipes for popular frameworks:

### Express
```typescript
app.use(express.json({ 
  verify: (req, _res, buf) => { 
    (req as any).rawBody = Buffer.from(buf); 
  } 
}));
```

### Fastify
```typescript
await app.register(require('fastify-raw-body'), {
  field: 'rawBody',
  global: true,
  encoding: false,
  runFirst: true
});
```

### Next.js Pages API
```typescript
export const config = { api: { bodyParser: false } };

// Then use built-in helper or read manually:
const raw = await getRawBody(req);
```

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) and ensure all tests pass:

```bash
npm test
npm run test:coverage
npm run lint
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Security

This library uses constant-time comparison for all signature verification to prevent timing attacks. If you discover a security vulnerability, please email security@yourcompany.com.