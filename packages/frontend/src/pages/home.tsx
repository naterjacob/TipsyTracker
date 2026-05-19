import Header from "../components/header"
import Feed from "../components/feed"
import "./home.css"



function Home() {

    return (
        <div className="home-page">
            <Header />

            <div className="home-content">

                <Feed />

                <div className="suggested-friends">

                    <h3 className="suggested-friends-title">
                        Suggested Friends:
                    </h3>

                    <div className="friend">
                        <div className="friend-icon orange" />
                        <p>Tucker E</p>
                    </div>

                    <div className="friend">
                        <div className="friend-icon yellow" />
                        <p>Adam R</p>
                    </div>

                    <div className="friend">
                        <div className="friend-icon red" />
                        <p>Jameson P</p>
                    </div>

                    <div className="friend">
                        <div className="friend-icon blue" />
                        <p>Reed S</p>
                    </div>

                    <div className="friend">
                        <div className="friend-icon teal" />
                        <p>Henry W</p>
                    </div>

                </div>

            </div>
        </div>
    );

}
export default Home;