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

  it('treats blank optional values as unset', () => {
    const c = loadConfig({
      DISCORD_TOKEN: '',
      GSI_AUTH_TOKEN: 'longenough',
      GSI_RECORD_DIR: '',
    });
    expect(c.DISCORD_TOKEN).toBeUndefined();
    expect(c.GSI_RECORD_DIR).toBeUndefined();
  });

  it('still requires GSI_AUTH_TOKEN when blank', () => {
    expect(() => loadConfig({ GSI_AUTH_TOKEN: '' })).toThrow(/GSI_AUTH_TOKEN/);
  });

  it('names bad keys without leaking values', () => {
    const bad = { DISCORD_TOKEN: 'secret-value', GSI_AUTH_TOKEN: 'x' };
    expect(() => loadConfig(bad)).toThrow(/GSI_AUTH_TOKEN/);
    expect(() => loadConfig(bad)).not.toThrow(/secret-value/);
  });
});
