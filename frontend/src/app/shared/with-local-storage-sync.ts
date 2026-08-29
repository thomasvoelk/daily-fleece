import { patchState, signalStoreFeature, type, watchState, withHooks } from '@ngrx/signals';

export function withLocalStorageSync<State extends object>(options: {
  key: string;
  select: (state: State) => Partial<State>;
}) {
  return signalStoreFeature(
    { state: type<State>() },
    withHooks({
      onInit(store) {
        const raw = localStorage.getItem(options.key);
        if (raw !== null) {
          patchState(store, JSON.parse(raw) as Partial<State>);
        }
        watchState(store, (state) => {
          localStorage.setItem(options.key, JSON.stringify(options.select(state)));
        });
      },
    }),
  );
}
