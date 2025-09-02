# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript library for webhook signature verification supporting multiple providers (Stripe, Slack, GitHub, Shopify, Razorpay, Twilio, GitLab) and generic HMAC verification. The library focuses on correctness, security (constant-time comparisons), and framework compatibility with adapters for Express, Fastify, Next.js, AWS Lambda, and Cloudflare Workers.

## Development Commands

- `npm test` - Run all tests using Vitest
- `npm run test:coverage` - Run tests with coverage reporting (90% threshold required)
- `npm run test:watch` - Run tests in watch mode
- `npm run build` - Build the library using TypeScript and tsup for multiple formats (ESM, CJS, types)
- `npm run dev` - Development mode with file watching
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run clean` - Remove dist and coverage directories

## Architecture

### Core Structure
- `src/index.ts` - Main entry point with `verifyWebhook()` function that routes to provider-specific verifiers
- `src/types.ts` - TypeScript definitions for all providers and verification options
- `src/utils.ts` - Common utilities for HMAC generation, constant-time comparison, header parsing

### Provider System
- `src/providers/` - Individual verification implementations for each supported provider
- Each provider exports a specific verification function (e.g., `verifyStripe`, `verifySlack`)
- Supports key rotation by accepting single secrets or arrays of secrets
- Generic HMAC provider allows custom signature schemes

### Framework Adapters
- `src/adapters/` - Framework-specific helpers for raw body extraction and middleware
- Express, Fastify, Next.js (Pages API), AWS Lambda, Cloudflare Workers adapters
- Each adapter handles the framework's specific request/response patterns

### Replay Protection
- `src/replay/` - Optional replay attack prevention using timestamp-based deduplication  
- Memory and Redis store implementations
- Configurable TTL and tolerance windows

### Key Design Patterns
- All verification functions return a `VerifyResult` object with `ok: boolean` status
- Provider-specific options are handled through discriminated union types
- Secret rotation is implemented by trying multiple secrets in sequence
- Raw body preservation is critical - all adapters ensure original bytes are available

### Security Features
- Constant-time string comparison using Node.js `timingSafeEqual`
- Proper tolerance window handling for timestamp-based signatures
- Replay protection support with configurable storage backends
- Support for multiple signature formats (hex, base64) and algorithms (SHA1, SHA256, SHA512)

## Testing

Tests are comprehensive with provider-specific test files in `test/` directory. Coverage thresholds are set at 90% for all metrics. The test suite includes:
- Individual provider verification tests
- Framework adapter tests  
- Edge case and error condition tests
- Replay store functionality tests

## Build System

Uses tsup for building with:
- Multiple output formats (ESM, CJS)
- TypeScript declarations
- Separate entry points for adapters and replay stores
- Tree-shakeable exports for optimal bundle size