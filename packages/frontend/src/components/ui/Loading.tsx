import { Box, CircularProgress, Typography } from "@mui/material";

type LoadingProps = {
  label?: string;
  /** Fill the viewport (for full-page loads). */
  fullPage?: boolean;
};

export default function Loading({ label, fullPage = false }: LoadingProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        py: 6,
        minHeight: fullPage ? "100vh" : undefined,
      }}
    >
      <CircularProgress />
      {label ? (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      ) : null}
    </Box>
  );
}
