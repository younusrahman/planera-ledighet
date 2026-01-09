import { Dialog, DialogContent } from "@mui/material";
import { useDialogStore } from "./dialogStore";
import { dialogRegistry } from "./DialogRegistry";

export function GlobalDialogProvider() {
  const { id, props, close } = useDialogStore();

  if (!id || !props) return null;

  const Component = dialogRegistry[id].component;

  return (
    <Dialog open onClose={close} maxWidth="sm" fullWidth>
      <DialogContent>
        <Component {...props} onClose={close} />
      </DialogContent>
    </Dialog>
  );
}
