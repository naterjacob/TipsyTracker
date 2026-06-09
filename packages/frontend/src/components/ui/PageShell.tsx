import type { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import Header from "../header";

type PageShellProps = {
  children: ReactNode;
  /** Optional callback forwarded to the Header's post composer. */
  onPostCreated?: () => void;
  maxWidth?: "sm" | "md" | "lg";
};

/**
 * Standard authenticated page layout: brand Header + a centered, responsive
 * content container on the app surface background.
 */
export default function PageShell({
  children,
  onPostCreated,
  maxWidth = "md",
}: PageShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header onPostCreated={onPostCreated} />
      <Container maxWidth={maxWidth} sx={{ py: { xs: 2, sm: 4 } }}>
        {children}
      </Container>
    </Box>
  );
}
