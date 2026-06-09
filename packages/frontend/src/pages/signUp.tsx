import { SignUp } from "@clerk/clerk-react";
import { Box, Container, Stack, Typography } from "@mui/material";

function SignUpPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center"
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ alignItems: "center", py: 6 }}>
          <Stack spacing={0.5} sx={{ textAlign: "center" }}>
            <Typography
              variant="h1"
              sx={{ fontStyle: "italic", color: "primary.main" }}
            >
              TipsyTracker
            </Typography>
            <Typography color="text.secondary">
              Create your account, then finish your profile.
            </Typography>
          </Stack>
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/onboarding"
            appearance={{ variables: { colorPrimary: "#034078" } }}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default SignUpPage;
