// leavesStore.ts
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { toast } from "./globalSnackbar";
import { apiRequest } from "../apiInstance";
import type { AbsenceBlockData } from "../../types";

type Id = string;

type State = {
  ids: Id[];
  byId: Record<Id, AbsenceBlockData>;
  loading: boolean;
  error: string | null;
};

type Actions = {
  setAll: (items: AbsenceBlockData[]) => void;
  add: (item: AbsenceBlockData) => void;
  update: (item: AbsenceBlockData) => void;
  remove: (id: Id) => void;
};

const useLeavesStore = create<State & { actions: Actions }>((set) => ({
  ids: [],
  byId: {},
  loading: false,
  error: null,

  actions: {
    setAll: (items) =>
      set(() => ({
        ids: items.map((i) => i.id),
        byId: items.reduce<Record<string, AbsenceBlockData>>((acc, item) => {
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
// SELECTORS (same API as before)
// -----------------------------
const useIds = () => useLeavesStore(useShallow((s) => s.ids));

const useItems = () =>
  useLeavesStore(useShallow((s) => s.ids.map((id) => s.byId[id])));

const useLoading = () => useLeavesStore((s) => s.loading);

const useError = () => useLeavesStore((s) => s.error);

const useActions = () => useLeavesStore((s) => s.actions);

const useItem = (id: Id) => useLeavesStore(useShallow((s) => s.byId[id]));

const useItemField = <K extends keyof AbsenceBlockData>(id: Id, field: K) =>
  useLeavesStore((s) => s.byId[id]?.[field]);

const useDerived = <R>(selectorFn: (items: AbsenceBlockData[]) => R) =>
  useLeavesStore(useShallow((s) => selectorFn(s.ids.map((id) => s.byId[id]))));

// -----------------------------
// CRUD SERVICE (same API as before)
// -----------------------------
async function loadAll() {
  const { actions } = useLeavesStore.getState();
  try {
    useLeavesStore.setState({ loading: true, error: null });
    const data = await apiRequest<AbsenceBlockData[]>("/leaves");
    actions.setAll(data);
  } catch (e: any) {
    useLeavesStore.setState({ error: "Failed to load data" });
    toast(`leaves: load failed`, "error");
    throw e;
  } finally {
    useLeavesStore.setState({ loading: false });
  }
}

async function createOne(body: AbsenceBlockData) {
  const { actions } = useLeavesStore.getState();
  try {
    const real = await apiRequest<AbsenceBlockData>("/leaves", {
      method: "POST",
      body: JSON.stringify(body),
    });
    actions.add(real);
    toast(`leaves: created`, "success");
    return real;
  } catch (e: any) {
    toast(`leaves: create failed`, "error");
    throw e;
  }
}

async function updateOne(id: Id, body: AbsenceBlockData) {
  const { byId, actions } = useLeavesStore.getState();
  const prev = byId[id];

  if (prev) actions.update({ ...prev, ...(body as any) });

  try {
    const real = await apiRequest<AbsenceBlockData>(`/leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    actions.update(real);
    toast(`leaves: updated`, "success");
    return real;
  } catch (e: any) {
    if (prev) actions.update(prev);
    toast(`leaves: update failed`, "error");
    throw e;
  }
}

async function removeOne(id: Id) {
  const { byId, actions } = useLeavesStore.getState();
  const prev = byId[id];

  if (prev) actions.remove(id);

  try {
    await apiRequest<void>(`/leaves/${id}`, { method: "DELETE" });
    toast(`leaves: deleted`, "success");
  } catch (e: any) {
    if (prev) actions.add(prev);
    toast(`leaves: delete failed`, "error");
    throw e;
  }
}

// -----------------------------
// EXPORT (same API as before)
// -----------------------------
export const leaves = {
  useStore: useLeavesStore,
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
