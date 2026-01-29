// ======================================
// ZUSTAND STORE FOR LEAVE BLOCKS
// ======================================
//
// Location: src/services/leaveBlockStore.ts
//
// This store centralizes all UI state for LeaveBlock components.
// You can access any block's state from anywhere in your app.

// ======================================
// USAGE EXAMPLES
// ======================================

// 1. GET STATE FOR A SPECIFIC BLOCK (in any component)
// -----------------------------------------------
import { useBlockState, useBlockIsResizing, useBlockVisualDuration } from '@/services/leaveBlockStore';

function MyComponent() {
const blockId = 'some-leave-id';

// Get entire block state
const blockState = useBlockState(blockId);
console.log(blockState); // { isResizing, visualDuration, visualStartShift, isTooltipOpen }

// Get specific properties
const isResizing = useBlockIsResizing(blockId);
const duration = useBlockVisualDuration(blockId);
const shift = useBlockVisualStartShift(blockId);
const tooltipOpen = useBlockIsTooltipOpen(blockId);
}

// 2. UPDATE STATE FOR A SPECIFIC BLOCK
// -----------------------------------------------
import { useLeaveBlockActions } from '@/services/leaveBlockStore';

function MyUpdater() {
const { setBlock } = useLeaveBlockActions();

// Update one or more properties
setBlock('block-123', { isResizing: true });
setBlock('block-123', { visualDuration: 5, visualStartShift: 2 });
}

// 3. RESET A BLOCK TO INITIAL STATE
// -----------------------------------------------
function MyReset() {
const { resetBlock } = useLeaveBlockActions();

// Reset to initial state with default duration
resetBlock('block-123', 5); // duration in days
}

// 4. REMOVE A BLOCK (cleanup on unmount)
// -----------------------------------------------
function MyCleanup() {
const { removeBlock } = useLeaveBlockActions();

useEffect(() => {
return () => {
removeBlock('block-123'); // Cleanup
};
}, []);
}

// 5. QUERY ALL BLOCKS IN STORE
// -----------------------------------------------
import { useLeaveBlockStore } from '@/services/leaveBlockStore';

function AllBlocksComponent() {
// Access entire store
const allBlocks = useLeaveBlockStore(s => s.blocks);

Object.entries(allBlocks).forEach(([id, state]) => {
console.log(`Block ${id}:`, state);
});
}

// ======================================
// STORE STRUCTURE
// ======================================
//
// blocks: {
// [blockId]: {
// isResizing: boolean,
// visualDuration: number,
// visualStartShift: number,
// isTooltipOpen: boolean
// },
// ...
// }

// ======================================
// AVAILABLE SELECTORS
// ======================================
//
// useBlockState(id) // Get entire block state
// useBlockIsResizing(id) // Get isResizing
// useBlockVisualDuration(id) // Get visualDuration
// useBlockVisualStartShift(id) // Get visualStartShift
// useBlockIsTooltipOpen(id) // Get isTooltipOpen
// useLeaveBlockActions() // Get all actions

// ======================================
// AVAILABLE ACTIONS
// ======================================
//
// setBlock(id, partialState) // Update one or more properties
// resetBlock(id, durationDays) // Reset to initial state
// removeBlock(id) // Remove block from store
// getBlock(id) // Imperative getter (non-hook)
