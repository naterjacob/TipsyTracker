import Post from "./post"



const posts = [
    {
        id: 1,
        username: "Hank V",
        avatarColor: "#5A6BEA",
        caption: "Had a fun night out beating my personal record!!!",
        bars: "SLO Brew Rock",
        beers: 2,
        shots: 1,
        mixedDrinks: 0
    },
    {
        id: 2,
        username: "Brock S",
        avatarColor: "#F6D484",
        caption: "Went drinking with the boys and kept going after they dropped",
        bars: "SLO Brew Rock, Frog and Peach Pub",
        beers: 8,
        shots: 4,
        mixedDrinks: 0
    },
    {
        id: 3,
        username: "Marcy",
        avatarColor: "#353433",
        caption: "Bonnie took me bar hopping to celebrate her new job",
        bars: "SLO Brew Rock, Naughty Oak Brewing, The Graduate, Bang the Drum Brewery",
        beers: 7,
        shots: 2,
        mixedDrinks: 3
    },
    {
        id: 4,
        username: "Bonnie",
        avatarColor: "#FFC1CC",
        caption: "Had some free time transferring between jobs and wanted to get messed up, also took Marcy with me for the ride.",
        bars: "SLO Brew Rock, Naughty Oak Brewing, The Graduate, Bang the Drum Brewery",
        beers: 5,
        shots: 4,
        mixedDrinks: 12
    }
];



export default function Feed() {

    return (
        <div className="home-feed">

            {posts.map((post) => (
                <Post
                    key={post.id}
                    username={post.username}
                    avatarColor={post.avatarColor}
                    caption={post.caption}
                    bars={post.bars}
                    beers={post.beers}
                    shots={post.shots}
                    mixedDrinks={post.mixedDrinks}
                />
            ))}

        </div>
    )

}