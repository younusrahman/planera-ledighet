import { Dialog, DialogContent, Fade } from "@mui/material";
import { useDialogStore } from "./dialogStore";
import { dialogRegistry } from "./DialogRegistry";

export function GlobalDialogProvider() {
  const { id, props, close } = useDialogStore();

  if (!id || !props) return null;

  const Component = dialogRegistry[id].component;

  return (
    <Dialog
      open
      onClose={close}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(255, 255, 255, 0.5) inset,
            0 -1px 1px rgba(0, 0, 0, 0.05) inset
          `,
          border: "1px solid",
          borderColor: "rgba(255, 255, 255, 0.3)",
          overflow: "hidden",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: "1px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          },
        },
      }}
      TransitionComponent={Fade}
      transitionDuration={250}
      sx={{
        "& .MuiDialog-container": {
          backdropFilter: "blur(2px)",
          backgroundColor: "rgba(0, 0, 0, 0.12)",
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "transparent",
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Component {...(props as any)} onClose={close}  />
      </DialogContent>
    </Dialog>
  );
}
