
export const globalState = {
  entities: {} as Record<string, unknown>,
};

export function registerEntity<TModule>(name: string, entity: TModule) {
  globalState.entities[name] = entity;
}

// Optional helper with typing:
export function getEntity<TModule = unknown>(name: string): TModule {
  const entity = globalState.entities[name];
  if (!entity) {
    throw new Error(`Entity '${name}' is not registered`);
  }
  return entity as TModule;
}
