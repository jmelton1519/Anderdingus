import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('applies defaults', () => {
    const c = loadConfig({
      DISCORD_TOKEN: 'abc',
      GSI_AUTH_TOKEN: 'longenough',
    });
    expect(c.GSI_PORT).toBe(3000);
  });

  it('names bad keys without leaking values', () => {
    const bad = { DISCORD_TOKEN: 'secret-value', GSI_AUTH_TOKEN: 'x' };
    expect(() => loadConfig(bad)).toThrow(/GSI_AUTH_TOKEN/);
    expect(() => loadConfig(bad)).not.toThrow(/secret-value/);
  });
});
