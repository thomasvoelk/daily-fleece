import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      // istanbul, not v8: v8's decorator-lowering source-map remapping mis-attributes
      // a phantom branch to every @Component/@Directive class declaration line, making
      // 100% branch coverage impossible. See vitest-dev/vitest#9256, #7879 and
      // angular/angular-cli#32283. Revisit when bumping vitest majors or if those close
      // with a real fix.
      provider: 'istanbul',
    },
  },
});
