import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="center-screen" style={{ textAlign: "center", padding: 24 }}>
      <div>
        <h1>404</h1>
        <p className="muted" style={{ margin: "8px 0 16px" }}>We could not find that page.</p>
        <Link to="/" className="btn">Back to home</Link>
      </div>
    </div>
  );
}