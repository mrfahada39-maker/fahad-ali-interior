type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  ts: string;
  requestId?: string;
  message: string;
  context: Record<string, unknown>;
  error?: string;
}

interface RequestIdStorage {
  run<T>(id: string, fn: () => T): T;
  getStore(): string | undefined;
}

let requestIdStorage: RequestIdStorage = {
  run: <T>(_id: string, fn: () => T) => fn(),
  getStore: () => undefined,
};

// AsyncLocalStorage is only available in the Node.js runtime. It is resolved at
// runtime via process.getBuiltinModule (not a static require) so that bundlers
// never try to resolve 'async_hooks' for the browser/edge bundles. In those
// environments we silently keep the no-op fallback above.
try {
  const nodeProcess = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process;
  const asyncHooks = nodeProcess?.getBuiltinModule?.('node:async_hooks') as
    | { AsyncLocalStorage?: new () => { run<T>(id: string, fn: () => T): T; getStore(): unknown } }
    | undefined;
  if (asyncHooks?.AsyncLocalStorage) {
    const als = new asyncHooks.AsyncLocalStorage();
    requestIdStorage = {
      run: <T>(id: string, fn: () => T) => als.run(id, fn),
      getStore: () => als.getStore() as string | undefined,
    };
  }
} catch {
  // Edge/browser runtime — use noop fallback
}

export function runWithRequestId<T>(id: string, fn: () => T): T {
  return requestIdStorage.run(id, fn);
}

export function currentRequestId(): string | undefined {
  return requestIdStorage.getStore();
}

function toErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): void {
  const entry: LogEntry = {
    level,
    ts: new Date().toISOString(),
    requestId: currentRequestId(),
    message,
    context: context ?? {},
    error: toErrorMessage(error),
  };
  const clean = Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined));
  const line = JSON.stringify(clean);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info:  (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn:  (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, error?: unknown, context?: Record<string, unknown>) =>
    write('error', message, context, error),
  audit: (action: string, context?: Record<string, unknown>) =>
    write('info', `audit:${action}`, context),
};

export function withRequestId<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestIdStorage.run(requestId, () => {
      fn().then(resolve, reject);
    });
  });
}
