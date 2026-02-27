import { Dialog, DialogContent, Fade } from "@mui/material";
import { useDialogStore } from "./dialogStore";
import { dialogRegistry } from "./DialogRegistry";

export function GlobalDialogProvider() {
  const { stack, close } = useDialogStore();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item, index) => {
        // FIX: Här mappar vi item.id som en giltig nyckel i dialogRegistry
        const registration =
          dialogRegistry[item.id as keyof typeof dialogRegistry];

        if (!registration) return null;
        const Component = registration.component;

        return (
          <Dialog
            key={`${item.id}-${index}`}
            open={true}
            onClose={close}
            maxWidth={item.maxWidth}
            fullWidth
            // Säkerställer att nya dialoger hamnar ovanpå gamla
            style={{ zIndex: 1300 + index }}
            TransitionComponent={Fade}
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <DialogContent sx={{ p: 3 }}>
              {/* props as any används för att Component kan ha olika props-typer */}
              <Component {...(item.props as any)} onClose={close} />
            </DialogContent>
          </Dialog>
        );
      })}
    </>
  );
}
