import '@testing-library/jest-dom/vitest';

// JSDOM doesn't implement the Canvas API. Angular CDK probes for canvas capabilities
// during component rendering, which produces "Not implemented: HTMLCanvasElement.getContext"
// noise in every test run. Stub it out so the warnings are suppressed.
HTMLCanvasElement.prototype.getContext = () => null;
