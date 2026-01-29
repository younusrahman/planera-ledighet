## Renaming Summary: Leave → Absence

All "Leave" terminology has been renamed to "Absence" across the codebase.

### Files Created

1. **`src/components/AbsenceBlock.tsx`** (replaces LeaveBlock.tsx)
   - Component: `AbsenceBlock` (was `LeaveBlock`)
   - Uses renamed Zustand store: `useAbsenceBlockStore`
   - Selector hooks:
     - `useAbsenceBlockIsResizing()`
     - `useAbsenceBlockVisualDuration()`
     - `useAbsenceBlockVisualStartShift()`
     - `useAbsenceBlockIsTooltipOpen()`
   - Action hook: `useAbsenceBlockActions()`

2. **`src/services/absenceBlockStore.ts`** (replaces leaveBlockStore.ts)
   - Main store: `useAbsenceBlockStore`
   - Interfaces:
     - `AbsenceBlockState`
     - `AbsenceBlockStore`
   - All selectors and actions updated with new names

### Files Updated

- **`src/components/TimelineDndContext.tsx`**
  - Import: `import { AbsenceBlock } from "./AbsenceBlock"`
  - Usage: `<AbsenceBlock ... />` (was `<LeaveBlock ... />`)

### Files to Remove (Optional)

You can safely delete the old files if they're not needed:

- `src/components/LeaveBlock.tsx`
- `src/services/leaveBlockStore.ts`
- `ZUSTAND_STORE_USAGE.md` (can update reference file with new names)

### Import Changes for Other Components

If you have other components importing these, update:

```typescript
// OLD
import { LeaveBlock } from "./LeaveBlock";
import {
  useLeaveBlockStore,
  useBlockIsResizing,
} from "@/services/leaveBlockStore";

// NEW
import { AbsenceBlock } from "./AbsenceBlock";
import {
  useAbsenceBlockStore,
  useAbsenceBlockIsResizing,
} from "@/services/absenceBlockStore";
```

### Usage Example

```typescript
import {
  useAbsenceBlockIsResizing,
  useAbsenceBlockActions,
} from "@/services/absenceBlockStore";

function MyComponent() {
  const isResizing = useAbsenceBlockIsResizing("absence-id");
  const { setBlock } = useAbsenceBlockActions();

  setBlock("absence-id", { visualDuration: 5 });
}
```

All functionality remains identical - only naming has changed.
