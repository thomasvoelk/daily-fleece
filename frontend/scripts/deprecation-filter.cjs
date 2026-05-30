// Suppress known third-party deprecation codes while --throw-deprecation remains active
// for everything else. Remove a code here once the upstream package ships a fix.
//
// DEP0205: @tailwindcss/node uses module.register() — tailwindlabs/tailwindcss#19893
const SUPPRESSED = new Set(['DEP0205']);

const orig = process.emitWarning.bind(process);
process.emitWarning = function (warning, ...args) {
  const opts = typeof args[0] === 'object' && args[0] !== null ? args[0] : {};
  const code = opts.code ?? args[1];
  if (typeof code === 'string' && SUPPRESSED.has(code)) return;
  orig(warning, ...args);
};
