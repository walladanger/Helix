import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { GROK_PROVIDERS } from './providers.ts';

test('GROK_PROVIDERS configuration', async (t) => {
  await t.test('assert exact list of providers', () => {
    assert.deepEqual(GROK_PROVIDERS, [
      { providerId: 'grok-google', idp: 'google', label: 'Google' },
      { providerId: 'grok-x', idp: 'twitter', label: 'X' },
    ]);
  });

  await t.test('assert providerIds are unique', () => {
    const providerIds = GROK_PROVIDERS.map((p) => p.providerId);
    const uniqueProviderIds = new Set(providerIds);
    assert.equal(providerIds.length, uniqueProviderIds.size);
  });

  await t.test('assert each providerId is a safe URL path segment', () => {
    for (const provider of GROK_PROVIDERS) {
      assert.match(provider.providerId, /^[a-z0-9-]+$/);
    }
  });

  await t.test('assert every providerId starts with "grok-"', () => {
    for (const provider of GROK_PROVIDERS) {
      assert.ok(provider.providerId.startsWith('grok-'));
    }
  });

  await t.test('assert labels are non-empty', () => {
    for (const provider of GROK_PROVIDERS) {
      assert.ok(provider.label.length > 0);
    }
  });
});
