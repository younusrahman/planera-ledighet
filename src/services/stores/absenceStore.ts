// absenceStore.ts
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { apiRequest } from "../apiInstance";
import type { Absence } from "../../types";
import { toast } from "./globalSnackbar";
import { queryClient } from "../../App";

type Id = string;

type State = {
  ids: Id[];
  byId: Record<Id, Absence>;
  loading: boolean;
  error: string | null;
};

type Actions = {
  setAll: (items: Absence[]) => void;
  add: (item: Absence) => void;
  update: (item: Absence) => void;
  remove: (id: Id) => void;
};

// --------------------------------------------------
// ZUSTAND STORE
// --------------------------------------------------
const useAbsenceStore = create<State & { actions: Actions }>((set) => ({
  ids: [],
  byId: {},
  loading: false,
  error: null,

  actions: {
    setAll: (items) =>
      set(() => ({
        ids: items.map((i) => i.id),
        byId: items.reduce<Record<string, Absence>>((acc, item) => {
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

// --------------------------------------------------
// SELECTORS (same API as before)
// --------------------------------------------------
const useIds = () => useAbsenceStore(useShallow((s) => s.ids));

const useItems = () =>
  useAbsenceStore(useShallow((s) => s.ids.map((id) => s.byId[id])));

const useLoading = () => useAbsenceStore((s) => s.loading);

const useError = () => useAbsenceStore((s) => s.error);

const useActions = () => useAbsenceStore((s) => s.actions);

const useItem = (id: Id) => useAbsenceStore(useShallow((s) => s.byId[id]));

const useItemField = <K extends keyof Absence>(id: Id, field: K) =>
  useAbsenceStore((s) => s.byId[id]?.[field]);

const useDerived = <R>(selectorFn: (items: Absence[]) => R) =>
  useAbsenceStore(useShallow((s) => selectorFn(s.ids.map((id) => s.byId[id]))));

// --------------------------------------------------
// MUTATION HELPER (TanStack Query v5)
// --------------------------------------------------
async function runMutation<T>(mutationFn: () => Promise<T>) {
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn,
  });
  return mutation.execute(undefined);
}

// --------------------------------------------------
// CRUD SERVICE (TanStack Query v5)
// --------------------------------------------------
async function loadAll() {
  const { actions } = useAbsenceStore.getState();

  try {
    useAbsenceStore.setState({ loading: true, error: null });

    const data = await queryClient.fetchQuery({
      queryKey: ["leaves"],
      queryFn: () => apiRequest<Absence[]>("/leaves"),
      staleTime: 1000 * 60 * 5,
    });

    actions.setAll(data);
  } catch (e: any) {
    useAbsenceStore.setState({ error: "Failed to load data" });
    toast("leaves: load failed", "error");
    throw e;
  } finally {
    useAbsenceStore.setState({ loading: false });
  }
}

async function createOne(body: Absence) {
  const { actions } = useAbsenceStore.getState();

  try {
    const newItem = await runMutation(() =>
      apiRequest<Absence>("/leaves", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );

    actions.add(newItem);

    queryClient.setQueryData<Absence[]>(["leaves"], (old) =>
      old ? [...old, newItem] : [newItem],
    );

    toast("leaves: created", "success");
    return newItem;
  } catch (e: any) {
    toast("leaves: create failed", "error");
    throw e;
  }
}

async function updateOne(id: Id, body: Absence) {
  const { byId, actions } = useAbsenceStore.getState();
  const prev = byId[id];

  if (prev) actions.update({ ...prev, ...(body as any) });

  try {
    const updated = await runMutation(() =>
      apiRequest<Absence>(`/leaves/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    );

    actions.update(updated);

    queryClient.setQueryData<Absence[]>(["leaves"], (old) =>
      old ? old.map((i) => (i.id === id ? updated : i)) : [updated],
    );

    toast("leaves: updated", "success");
    return updated;
  } catch (e: any) {
    if (prev) actions.update(prev);
    toast("leaves: update failed", "error");
    throw e;
  }
}

async function removeOne(id: Id) {
  const { byId, actions } = useAbsenceStore.getState();
  const prev = byId[id];

  if (prev) actions.remove(id);

  try {
    await runMutation(() =>
      apiRequest<void>(`/leaves/${id}`, {
        method: "DELETE",
      }),
    );

    queryClient.setQueryData<Absence[]>(["leaves"], (old) =>
      old ? old.filter((i) => i.id !== id) : [],
    );

    toast("leaves: deleted", "success");
  } catch (e: any) {
    if (prev) actions.add(prev);
    toast("leaves: delete failed", "error");
    throw e;
  }
}

// --------------------------------------------------
// EXPORT (same API as before)
// --------------------------------------------------
export const absence = {
  useStore: useAbsenceStore,
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
