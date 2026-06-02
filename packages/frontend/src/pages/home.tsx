import { useState } from "react";
import Header from "../components/header";
import Feed from "../components/feed";
import RightSidebar from "../components/rightSidebar";
import "./home.css";

function Home() {
  const [feedRefreshToken, setFeedRefreshToken] = useState(0);

  return (
    <div className="home-page">
      <Header onPostCreated={() => setFeedRefreshToken((value) => value + 1)} />

      <main className="container home-content">
        <div className="home-layout">
          <Feed refreshToken={feedRefreshToken} />
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}

export default Home;