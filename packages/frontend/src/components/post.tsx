import "./post.css";

type PostProps = {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  caption: string | null;
  barCount: number;
  totalDrinks: number;
  publishedAt: number;
};

export default function Post({
  displayName,
  username,
  avatarUrl,
  caption,
  barCount,
  totalDrinks,
  publishedAt
}: PostProps) {
  const initialsSource = displayName || username || "U";
  const initials = initialsSource.slice(0, 1).toUpperCase();

  return (
    <article className="tt-post-card">
      <header className="tt-post-head">
        <div className="tt-post-user">
          {avatarUrl ? (
            <img className="tt-post-icon" src={avatarUrl} alt="" />
          ) : (
            <div className="tt-post-icon tt-post-icon-fallback">{initials}</div>
          )}
          <div>
            <h4 className="tt-post-name">{displayName || username || "Unknown user"}</h4>
            <p className="tt-post-meta">
              {username ? `@${username}` : "No username"} ·{" "}
              {new Date(publishedAt * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      <div className="tt-post-caption-section">
        <p className="tt-post-caption">{caption || "No caption"}</p>
      </div>

      <div className="tt-post-bottom">
        <dl className="tt-post-drinks">
          <div className="tt-drink">
            <dt>Stops</dt>
            <dd>{barCount}</dd>
          </div>
          <div className="tt-drink">
            <dt>Drinks</dt>
            <dd>{totalDrinks}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
