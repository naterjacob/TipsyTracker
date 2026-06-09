import { useState } from "react";
import { Box, Container } from "@mui/material";
import Header from "../components/header";
import Feed from "../components/feed";
import RightSidebar from "../components/rightSidebar";

function Home() {
  const [feedRefreshToken, setFeedRefreshToken] = useState(0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header onPostCreated={() => setFeedRefreshToken((value) => value + 1)} />

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "start",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) 320px"
            }
          }}
        >
          <Feed refreshToken={feedRefreshToken} />
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <RightSidebar />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
