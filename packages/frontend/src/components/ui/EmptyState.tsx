import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1,
        py: 5,
        px: 2,
        color: "text.secondary",
      }}
    >
      {icon ? <Box sx={{ fontSize: 40, lineHeight: 1 }}>{icon}</Box> : null}
      <Typography variant="h6" color="text.primary">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}
