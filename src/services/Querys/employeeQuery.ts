import { apiRequest } from "../apiInstance";
import { toast } from "../stores/globalSnackbar";
import { useQuery } from "@tanstack/react-query";
import type { Employee, Team } from "../../types";
import { queryClient } from "../../App";


type Id = string;

// CRUD SERVICES
async function loadAll() {
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ["employees"],
      queryFn: () => apiRequest<Employee[]>("/Employee"),
      staleTime: 1000 * 60 * 5,
    });
    return data;
  } catch (e: any) {
    toast("employees: load failed", "error");
    throw e;
  }
}

async function createOne(body: Partial<Employee>) {
  try {
    const newItem = await apiRequest<Employee>("/Employee", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // 1. Add the new employee to the employee list
    queryClient.setQueryData<Employee[]>(["employees"], (old) =>
      old ? [...old, newItem] : [newItem],
    );

    // 2. MANUALLY update the specific team to include this new employee ID
    // This is what makes it show up in the sidebar immediately!
    queryClient.setQueryData<Team[]>(["teams"], (oldTeams) => {
      if (!oldTeams) return [];
      return oldTeams.map((t) => {
        if (t.id === newItem.id) {
          return {
            ...t,
            employeeIds: [...(t.id || []), newItem.id],
          };
        }
        return t;
      });
    });

    toast("employee: created", "success");
    return newItem;
  } catch (e: any) {
    toast("employee: create failed", "error");
    throw e;
  }
}

async function updateOne(id: Id, body: Partial<Employee>) {
  try {
    await apiRequest<Employee>(`/Employee/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // Use refetchQueries to force an immediate refresh instead of just invalidating
    await queryClient.refetchQueries({ queryKey: ["employees"] });
    await queryClient.refetchQueries({ queryKey: ["teams"] });

    toast("employee: updated", "success");
  } catch (e: any) {
    toast("employee: update failed", "error");
    throw e;
  }
}

async function removeOne(id: Id) {
  try {
    await apiRequest<void>(`/Employee/${id}`, { method: "DELETE" });

    queryClient.setQueryData<Employee[]>(["employees"], (old) =>
      old ? old.filter((i) => i.id !== id) : [],
    );

    toast("employee: deleted", "success");
  } catch (e: any) {
    toast("employee: delete failed", "error");
    throw e;
  }
}

// SELECTORS
function useItems() {
  const { data } = useQuery({
    queryKey: ["employees"],
    queryFn: loadAll,
  });
  return data || [];
}

function useItem(id: Id) {
  const items = useItems();
  return items.find((item) => item.id === id);
}

function useIds() {
  const items = useItems();
  return items.map((item) => item.id);
}

function useLoading() {
  const { isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: loadAll,
  });
  return isLoading;
}

export const employee = {
  // CRUD operations
  loadAll,
  createOne,
  updateOne,
  removeOne,

  // Selectors
  useItems,
  useItem,
  useIds,
  useLoading,
};
