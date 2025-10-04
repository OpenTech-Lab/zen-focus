import React from 'react';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Make React available globally for JSX
global.React = React;

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
