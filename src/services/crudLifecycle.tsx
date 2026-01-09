type CrudType = "create" | "update" | "remove" | "load";

interface CrudContext<T, TBody> {
  entityName: string;
  id?: string;
  body?: TBody;
  result?: T;
  error?: unknown;
}

type CrudHook<T, TBody> = (ctx: CrudContext<T, TBody>) => void | Promise<void>;

interface CrudLifecycle<T, TBody> {
  before: Partial<Record<CrudType, CrudHook<T, TBody>[]>>;
  after: Partial<Record<CrudType, CrudHook<T, TBody>[]>>;
}

// global registry keyed by entity name
const crudLifecycleRegistry: Record<string, CrudLifecycle<any, any>> = {};

export function registerCrudHook<T, TBody>(
  entityName: string,
  when: "before" | "after",
  type: CrudType,
  hook: CrudHook<T, TBody>
) {
  const entry =
    crudLifecycleRegistry[entityName] ??
    (crudLifecycleRegistry[entityName] = { before: {}, after: {} });

  const bucket = entry[when][type] ?? (entry[when][type] = []);
  bucket.push(hook);
}

export async function runCrudHooks<T, TBody>(
  entityName: string,
  when: "before" | "after",
  type: CrudType,
  ctx: CrudContext<T, TBody>
) {
  const entry = crudLifecycleRegistry[entityName];
  if (!entry) return;
  const hooks = entry[when][type];
  if (!hooks || hooks.length === 0) return;

  for (const hook of hooks) {
    await hook(ctx);
  }
}
