import "./header.css"
import { Link } from "react-router-dom";
import { useState } from "react";



export default function Header() {

    //stuff for pop up to make a post
    const [showPost, setShowPost] = useState(false);

    return (
        <header className="header">
            <Link to="/home" className="logo">TypsyTracker</Link>
            {/*Will change account to pop into account page later along with profile image*/}
            <button className="account" />
            <button onClick={() => setShowPost(true)} className="post">+</button>

            {showPost && (

                //Need to change this to take be a pop up for the make a post component
                <div className="modal-overlay">
                    <div className="modal">
                        <button onClick={() => setShowPost(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

        </header>
    )

}