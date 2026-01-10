// src/services/entityCrud.ts
import { runCrudHooks } from "./crudLifecycle";
import { toast } from "./globalSnackbar";

export function createCrudActions<T extends { id: string }, TBody>(
  entityName: string,
  api: {
    fetchAll: () => Promise<T[]>;
    create: (body: TBody) => Promise<T>;
    update: (id: string, body: TBody) => Promise<T>;
    remove: (id: string) => Promise<void>;
  },
  store: {
    getState: () => {
      ids: string[];
      byId: Record<string, T>;
      actions: {
        setAll: (items: T[]) => void;
        add: (item: T) => void;
        update: (item: T) => void;
        remove: (id: string) => void;
      };
    };
    setState: (partial: any) => void;
  }
) {
  return {
    /**
     * Hämtar alla poster från API och uppdaterar storen
     */
    async loadAll() {
      const { actions } = store.getState();
      await runCrudHooks(entityName, "before", "load", { entityName });

      try {
        store.setState({ loading: true, error: null });
        const data = await api.fetchAll();
        actions.setAll(data);

        await runCrudHooks(entityName, "after", "load", {
          entityName,
          result: data,
        });
      } catch (e: any) {
        store.setState({ error: "Failed to load data" });
       toast(e.message || `${entityName}: load failed`, "error");
        throw e;
      } finally {
        store.setState({ loading: false });
      }
    },

    /**
     * Skapar en ny post.
     * FIX: Väntar på API:ets svar för att få det riktiga GUID-ID:t.
     */
    async createOne(body: TBody) {
      const { actions } = store.getState();

      await runCrudHooks(entityName, "before", "create", {
        entityName,
        body,
      });

      try {
        // 1. Skicka till servern (Servern skapar GUID ID här)
        const real = await api.create(body);

        // 2. Lägg till det bekräftade objektet i UI-storen
        actions.add(real);

        await runCrudHooks(entityName, "after", "create", {
          entityName,
          body,
          result: real,
        });

        toast(`${entityName}: created`, "success");
        return real;
      } catch (e: any) {
        toast(e.message || `${entityName}: create failed`, "error");
        throw e;
      }
    },

    /**
     * Uppdaterar en post
     */
    async updateOne(id: string, body: TBody) {
      const { actions, byId } = store.getState();
      const prev = byId[id];

      await runCrudHooks(entityName, "before", "update", {
        entityName,
        id,
        body,
      });

      // Optimistisk uppdatering i UI
      if (prev) actions.update({ ...prev, ...(body as any) });

      try {
        const real = await api.update(id, body);
        actions.update(real);

        await runCrudHooks(entityName, "after", "update", {
          entityName,
          id,
          body,
          result: real,
        });

        toast(`${entityName}: updated`, "success");
        return real;
      } catch (e: any) {
        // Om det skiter sig, rulla tillbaka till det gamla värdet
        if (prev) actions.update(prev);
        toast(e.message || `${entityName}: update failed`, "error");
        throw e;
      }
    },

    /**
     * Tar bort en post
     */
    async removeOne(id: string) {
      const { actions, byId } = store.getState();
      const prev = byId[id];

      await runCrudHooks(entityName, "before", "remove", {
        entityName,
        id,
      });

      // Optimistisk borttagning
      if (prev) actions.remove(id);

      try {
        await api.remove(id);

        await runCrudHooks(entityName, "after", "remove", {
          entityName,
          id,
        });

        toast(`${entityName}: deleted`, "success");
      } catch (e: any) {
        // Om radering misslyckas, lägg tillbaka posten i listan
        if (prev) actions.add(prev);
        const errorMessage = e.message || `${entityName}: delete failed`;
        toast(errorMessage, "error");
        throw e;
      }
    },
  };
}
