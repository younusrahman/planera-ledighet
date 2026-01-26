# 📘 Entity Modules, Global State & App Services

This project utilizes a generic entity module system built on **Zustand**. It provides a standardized way to handle data fetching, state management, and optimistic UI updates across the application.

---

## 📖 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Accessing Entities](#-accessing-entities)
3. [CRUD API Reference](#-crud-api-reference)
4. [Usage in React (.tsx)](#-usage-in-react-tsx)
5. [Usage in Logic (.ts)](#-usage-in-logic-ts)
6. [UI Store (Sidebar & Layout)](#-ui-store)
7. [Developer Guides](#-developer-guides)
    - [Registering New UI State](#how-to-register-new-ui-state)
    - [Creating a New Entity Module](#how-to-create-a-new-entity-module)
8. [Folder Structure](#-folder-structure)

---

## 🧱 Architecture Overview

The system is built on a layered architecture that ensures separation of concerns while providing dynamic access to any data entity.

```text
┌──────────────────────────────────────────────────────────────┐
│                          UI Layer                            │
│  (React Components using selectors + service functions)       │
└───────────────▲───────────────────────────────▲──────────────┘
                │                               │
                │ selectors                     │ service calls
                │                               │
┌───────────────┴───────────────────────────────┴──────────────┐
│                     Entity Modules (Zustand)                  │
│  createEntityModule()                                         │
│  - Normalized state (ids, byId)                               │
│  - Selectors (useItems, useItem, useDerived)                  │
│  - CRUD service layer (loadAll, createOne, updateOne, remove) │
│  - Optimistic updates + rollback                              │
│  - Auto-register into globalState                             │
└───────────────▲───────────────────────────────▲──────────────┘
                │                               │
                │ global registry                │ dynamic access
                │                               │
┌───────────────┴───────────────────────────────┴──────────────┐
│                       Global Registry                         │
│  registerEntity(name, module)                                 │
│  getEntity(name)                                              │
│  appServices(name)                                            │
│  appServicesStatic.<entity>                                   │
└───────────────▲───────────────────────────────▲──────────────┘
                │                               │
                │ API calls                     │
                │                               │
┌───────────────┴───────────────────────────────┴──────────────┐
│                        API Layer                              │
│  apiRequest<T>(url, options)                                  │
│  - JSON fetch wrapper                                          │
│  - Error handling                                              │
│  - Used by entity modules                                      │
└───────────────────────────────────────────────────────────────┘
```

---

## 🚀 Accessing Entities

### 1. Static Access (Autocomplete-Friendly)
Ideal for UI components where the entity type is known. Provides full IntelliSense.

```typescript
import { appServicesStatic } from "@/services/appServices";

// Hooks
const items = appServicesStatic.absenceTypes.useItems();

// Actions
await appServicesStatic.absenceTypes.loadAll();
```

### 2. Dynamic Access (Flexible)
Perfect for utilities, loops, or generic tools where the entity name might be a variable.

```typescript
import { appServices } from "@/services/appServices";

const entityName = "absenceTypes";
const items = appServices(entityName).useItems();
```

---

## 🟧 CRUD API Reference

Every entity module exposes the same standardized API:

| Method | Description |
| :--- | :--- |
| `loadAll()` | Fetch all items from API |
| `createOne(body)` | Create new item (optimistic) |
| `updateOne(id, body)` | Update item (optimistic) |
| `removeOne(id)` | Delete item (optimistic) |
| `useItems()` | Selector for all items (Array) |
| `useItem(id)` | Selector for a single item |
| `useItemField(id, field)`| Selector for a specific field |
| `useLoading()` | Returns boolean loading state |
| `useError()` | Returns error state |

---

## 🟪 Usage in React (.tsx)

```tsx
const AbsenceList = () => {
  const items = appServices("absenceTypes").useItems();
  const isLoading = appServices("absenceTypes").useLoading();

  useEffect(() => {
    appServices("absenceTypes").loadAll();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id} style={{ color: item.color }}>{item.label}</li>
      ))}
    </ul>
  );
};
```

---

## 🟫 Usage in Logic (.ts)

You can access state and trigger actions outside of React components.

```typescript
// Read state imperatively
const state = appServices("absenceTypes").useStore.getState();
console.log(state.byId);

// Trigger actions
await appServices("absenceTypes").createOne({
  label: "Training",
  color: "#33cc99",
});
```

---

## 🟨 UI Store

The UI store handles non-entity state, such as sidebar visibility or themes.

```typescript
import { useSidebarState, useUIActions, useUIStore } from "@/state/ui/uiStore";

// In React
const sidebar = useSidebarState();
const { setSidebar } = useUIActions();

// In standard TS
useUIStore.getState().actions.setSidebar("hidden");
```

---

## 📁 Folder Structure

```text
src/
├── services/
│   ├── apiInstance.ts          # Generic fetch wrapper
│   ├── globalState.ts          # Registry for all entity modules
│   ├── appServices.ts          # Static/Dynamic accessors
│   ├── entities/               # Entity Module definitions
│   │   ├── absenceTypes.ts
│   │   └── employees.ts
│   └── entityModule.ts         # The generic factory function
├── state/
│   └── ui/
│       └── uiStore.ts          # Sidebar & UI-only state
└── types/
    └── index.ts                # Shared TypeScript interfaces
```

---

## 🛠 Developer Guides

### How to Register New UI State
1. Open `src/state/ui/uiStore.ts`.
2. Update the `UIState` interface.
3. Add the initial value and the action in the `create` block.
4. Export a dedicated hook for the new property for performance.

### How to Create a New Entity Module
1. **Define the Type**: Add the interface to `src/types/index.ts`.
2. **Create the Module**: Create `src/services/entities/newEntity.ts`.
3. **Configure API**:
```typescript
export const employees = createEntityModule<Employee, EmployeeBody>({
  name: "employees",
  fetchAll: () => apiRequest<Employee[]>("/api/employees"),
  create: (body) => apiRequest("/api/employees", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/api/employees/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/api/employees/${id}`, { method: "DELETE" }),
});
```
4. **Registration**: The module is automatically registered via `createEntityModule`.

---

## 🚀 Developer Onboarding
1. **Install**: `npm install`
2. **Dev**: `npm run dev`
3. **Debug**: Use React DevTools or check the global registry in the console:
   `console.log(globalState.entities);`



