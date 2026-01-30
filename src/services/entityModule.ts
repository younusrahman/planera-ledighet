import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { registerEntity } from "./globalState";
import { toast } from "./globalSnackbar";
import type { AbsenceReason } from "../types";

export interface BaseEntity {
  id: string;
}

export interface EntityConfig<T extends BaseEntity, TBody> {
  name: string; // registry key
  fetchAll: () => Promise<T[]>;
  create: (body: TBody) => Promise<T>;
  update: (id: string, body: TBody) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

type Id = string;

export function createEntityModule<T extends BaseEntity, TBody>(
  config: EntityConfig<T, TBody>,
  absenceTypes: AbsenceReason[] = [],
) {
  type State = {
    ids: Id[];
    byId: Record<Id, T>;
    loading: boolean;
    error: string | null;
  };

  type Actions = {
    setAll: (items: T[]) => void;
    add: (item: T) => void;
    update: (item: T) => void;
    remove: (id: Id) => void;
  };

  const useStore = create<State & { actions: Actions }>((set) => ({
    ids: [],
    byId: {},
    loading: false,
    error: null,

    actions: {
      setAll: (items) =>
        set(() => ({
          ids: items.map((i) => i.id),
          byId: items.reduce<Record<string, T>>((acc, item) => {
            acc[item.id] = item;
            return acc;
          }, {}),
        })),

      add: (item) =>
        set((state) => {
          if (state.byId[item.id]) return state;
          return {
            ids: [...state.ids, item.id],
            byId: { ...state.byId, [item.id]: item },
          };
        }),

      update: (item) =>
        set((state) =>
          state.byId[item.id]
            ? {
                ids: state.ids,
                byId: { ...state.byId, [item.id]: item },
              }
            : state,
        ),

      remove: (id) =>
        set((state) => {
          if (!state.byId[id]) return state;
          const { [id]: _, ...rest } = state.byId;
          return {
            ids: state.ids.filter((x) => x !== id),
            byId: rest,
          };
        }),
    },
  }));

  // -----------------------------
  // SELECTORS (Modern useShallow syntax)
  // -----------------------------
  const useIds = () => useStore(useShallow((s) => s.ids));

  const useItems = () =>
    useStore(useShallow((s) => s.ids.map((id) => s.byId[id])));

  const useLoading = () => useStore((s) => s.loading);

  const useError = () => useStore((s) => s.error);

  const useActions = () => useStore((s) => s.actions);

  // Item-level selector
  const useItem = (id: Id) => useStore(useShallow((s) => s.byId[id]));

  // Single field selector (No shallow needed for primitives)
  const useItemField = <K extends keyof T>(id: Id, field: K) =>
    useStore((s) => s.byId[id]?.[field]);

  // Derived selector
  const useDerived = <R>(selectorFn: (items: T[]) => R) =>
    useStore(useShallow((s) => selectorFn(s.ids.map((id) => s.byId[id]))));

  // -----------------------------
  // SERVICE LAYER (Imperative API)
  // -----------------------------
  // Note: We use useStore.getState() instead of Hooks here
  // so these functions can be called safely inside useEffect or event handlers.

  async function loadAll() {
    const { actions } = useStore.getState();
    try {
      useStore.setState({ loading: true, error: null });
      const data = await config.fetchAll();
      actions.setAll(data);
    } catch (e) {
      useStore.setState({ error: "Failed to load data" });
      toast(`${config.name}: load failed`, "error");
      throw e;
    } finally {
      useStore.setState({ loading: false });
    }
  }

  async function createOne(body: TBody) {
    const { actions } = useStore.getState();

    try {
      const real = await config.create(body);
      actions.add(real);
      toast(`${config.name}: created`, "success");
      return real;
    } catch (e) {
      toast(`${config.name}: create failed`, "error");
      throw e;
    }
  }

  async function updateOne(id: Id, body: TBody) {
    const { byId, actions } = useStore.getState();
    const prev = byId[id];

    if (prev) actions.update({ ...prev, ...(body as any) });

    try {
      const real = await config.update(id, body);
      actions.update(real);
      toast(`${config.name}: updated`, "success");
      return real;
    } catch (e) {
      if (prev) actions.update(prev);
      toast(`${config.name}: update failed`, "error");
      throw e;
    }
  }

  async function removeOne(id: Id) {
    const { byId, actions } = useStore.getState();
    const prev = byId[id];

    if (prev) actions.remove(id);

    try {
      await config.remove(id);
      toast(`${config.name}: deleted`, "success");
    } catch (e) {
      if (prev) actions.add(prev);
      toast(`${config.name}: delete failed`, "error");
      throw e;
    }
  }

  // -----------------------------
  // ENTITY MODULE EXPORT
  // -----------------------------
  const entity = {
    useStore,
    useIds,
    useItems,
    useLoading,
    useError,
    useActions,
    useItem,
    useItemField,
    useDerived,
    loadAll,
    createOne,
    updateOne,
    removeOne,
  };

  registerEntity(config.name, entity);

  return entity;
}
