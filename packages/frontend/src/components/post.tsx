import "./post.css"



type PostProps = {
    username: string;
    avatarColor: string;
    caption: string;
    bars: string;
    beers: number;
    shots: number;
    mixedDrinks: number;
};



export default function Post({
    username,
    avatarColor,
    caption,
    bars,
    beers,
    shots,
    mixedDrinks
}: PostProps) {

    return (
        <div className="tt-post-card">

            {/*Top of the post with the profile icon and username*/}
            <div className="tt-post-head">
                <div
                    className="tt-post-icon"
                    style={{ backgroundColor: avatarColor }}
                />

                <p className="tt-post-name">
                    {username}
                </p>
            </div>

            {/*Caption section with the post text and bars visited*/}
            <div className="tt-post-caption-section">
                <p className="tt-post-caption">
                    {caption}
                </p>

                <p className="tt-post-bars">
                    Bars Hopped: {bars}
                </p>
            </div>

            {/*Empty media area where photos or videos can be added later*/}
            <div className="tt-post-media">
                {/*Photo or video will go here later*/}
            </div>

            {/*Bottom bar with like/comment buttons and drink totals*/}
            <div className="tt-post-bottom">

                {/*Post interaction buttons*/}
                <div className="tt-post-actions">
                    <button className="tt-action-button" aria-label="Like post">
                        <svg
                            className="tt-action-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M20.8 4.6C18.9 2.8 15.9 2.8 14 4.7L12 6.7L10 4.7C8.1 2.8 5.1 2.8 3.2 4.6C1.1 6.7 1.1 10 3.2 12.1L12 21L20.8 12.1C22.9 10 22.9 6.7 20.8 4.6Z"
                            />
                        </svg>
                    </button>

                    <button className="tt-action-button" aria-label="Comment on post">
                        <svg
                            className="tt-action-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M4 5.5C4 4.1 5.1 3 6.5 3H17.5C18.9 3 20 4.1 20 5.5V13.5C20 14.9 18.9 16 17.5 16H10L5 20V16H6.5C5.1 16 4 14.9 4 13.5V5.5Z"
                            />
                        </svg>
                    </button>
                </div>

                {/*Drink totals shown on the right side of the bottom bar*/}
                <div className="tt-post-drinks">

                    <div className="tt-drink">
                        <svg
                            className="tt-drink-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path d="M7 8H15V20H7V8Z" />
                            <path d="M15 10H18C19.1 10 20 10.9 20 12V15C20 16.1 19.1 17 18 17H15" />
                            <path d="M6 8H16" />
                            <path d="M8 5H14" />
                        </svg>

                        <p>
                            x {beers}
                        </p>
                    </div>

                    <div className="tt-drink">
                        <svg
                            className="tt-drink-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path d="M8 5H16L15 19H9L8 5Z" />
                            <path d="M9 9H15" />
                        </svg>

                        <p>
                            x {shots}
                        </p>
                    </div>

                    <div className="tt-drink">
                        <svg
                            className="tt-drink-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path d="M5 5H19L14 12H10L5 5Z" />
                            <path d="M12 12V19" />
                            <path d="M8 19H16" />
                        </svg>

                        <p>
                            x {mixedDrinks}
                        </p>
                    </div>

                </div>

            </div>

        </div>
    )

}