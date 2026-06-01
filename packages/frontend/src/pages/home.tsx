import { useState } from "react";
import Header from "../components/header";
import Feed from "../components/feed";
import "./home.css";

function Home() {
  const [feedRefreshToken, setFeedRefreshToken] = useState(0);

  return (
    <div className="home-page">
      <Header onPostCreated={() => setFeedRefreshToken((value) => value + 1)} />

      <main className="container home-content">
        <Feed refreshToken={feedRefreshToken} />
      </main>
    </div>
  );
}

export default Home;
