import { Dialog, DialogContent, Fade } from "@mui/material";
import { useDialogStore } from "./dialogStore";
import { dialogRegistry } from "./DialogRegistry";

export function GlobalDialogProvider() {
  const { stack, close } = useDialogStore();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item, index) => {
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
            fullScreen={item.fullScreen || false} // Add option for fullscreen
            style={{ zIndex: 1300 + index }}
            TransitionComponent={Fade}
            // CRITICAL: Allow dialog to scroll if content is tall
            scroll="paper" // or "body"
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                // CRITICAL: Allow dialog paper to be tall
                maxHeight: "90vh", // Limit to 90% of viewport
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              },
            }}
          >
            <DialogContent
              sx={{
                p: 3,
                // CRITICAL: Make content area scrollable
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Component {...(item.props as any)} onClose={close} />
            </DialogContent>
          </Dialog>
        );
      })}
    </>
  );
}
