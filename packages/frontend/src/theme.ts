import { createTheme } from "@mui/material/styles";

// Brand palette (previously hardcoded across components).
const BRAND = {
  primary: "#034078",
  ink: "#22303a",
  muted: "#5b6b75",
  surface: "#f5f8fa",
  border: "#dbe4ea",
} as const;

const theme = createTheme({
  palette: {
    primary: { main: BRAND.primary },
    text: { primary: BRAND.ink, secondary: BRAND.muted },
    background: { default: BRAND.surface, paper: "#ffffff" },
    divider: BRAND.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif',
    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.4rem", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999 } },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small", fullWidth: true },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { borderColor: BRAND.border, borderRadius: 14 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "default" },
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderBottom: `1px solid ${BRAND.border}`,
        },
      },
    },
  },
});

export { BRAND };
export default theme;
