import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography variant="h1" sx={{ color: "primary.main" }}>
          404
        </Typography>
        <Typography variant="h6">This page doesn't exist.</Typography>
        <Typography color="text.secondary">
          The page you're looking for may have moved or never existed.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/home")}>
          Back to home
        </Button>
      </Stack>
    </Box>
  );
}
