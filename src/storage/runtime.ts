import { createClient } from "@libsql/client/web";
import type { AppConfig } from "../config";
import type { CounterStore, D1DatabaseLike, RuntimeBindings } from "../types";
import { D1Store } from "./d1";
import { LibsqlStore } from "./libsql";

const d1Stores = new WeakMap<object, CounterStore>();
let remoteStore: { url: string; store: CounterStore } | undefined;

export function runtimeStore(env: RuntimeBindings, config: AppConfig): CounterStore {
  if (env.DB) {
    const key = env.DB as object;
    let store = d1Stores.get(key);
    if (!store) {
      store = new D1Store(env.DB as D1DatabaseLike);
      d1Stores.set(key, store);
    }
    return store;
  }

  if (!config.tursoDatabaseUrl) {
    throw new Error("Storage is not configured. Bind D1 or set TURSO_DATABASE_URL.");
  }
  if (!remoteStore || remoteStore.url !== config.tursoDatabaseUrl) {
    remoteStore = {
      url: config.tursoDatabaseUrl,
      store: new LibsqlStore(
        createClient({
          url: config.tursoDatabaseUrl,
          ...(config.tursoAuthToken ? { authToken: config.tursoAuthToken } : {}),
        }),
      ),
    };
  }
  return remoteStore.store;
}
