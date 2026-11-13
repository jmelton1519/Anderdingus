import { expect, it } from 'vitest';
import { projectName } from '../src/index.js';

it('loads the project entry point', () => {
  expect(projectName).toBe('anderdingus');
});
