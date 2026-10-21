import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { COURSE_LABEL, REPO_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { title: "Skill Gap Analysis", text: "Compare your skills with real role requirements.", bg: "#e5e0fb", fg: "#2a2a7c" },
  { title: "Interactive Milestone Boards", text: "Plan, start and finish learning tasks on a board.", bg: "#cdf3ee", fg: "#064e4a" },
  { title: "Resource Bookmarks", text: "Save videos, articles and docs against each skill.", bg: "#fee9a9", fg: "#5c3d00" },
  { title: "Analytics & Readiness Score", text: "Watch one score rise as you close gaps.", bg: "#ffd7e3", fg: "#8a1640" },
];

export default function Landing() {
  const { user } = useAuth();
  const start = user ? "/dashboard" : "/auth";

  return (
    <>
      <header className="lp-nav">
        <Logo />
        <nav>
          <a href="#features">About</a>
          <a href="#features">Features</a>
          <Link to={start}>{user ? "Dashboard" : "Login"}</Link>
          <Link to={start} className="btn btn-amber">Get Started</Link>
        </nav>
      </header>

      <section className="hero">
        <h1>Map Your Path to Your Dream Tech Role</h1>
        <p>Rate your skills, see exactly what is missing for your target role, and follow milestones until you are ready.</p>
        <Link to={start} className="btn btn-amber btn-lg">Start Skill Assessment</Link>
      </section>

      <section id="features" className="features">
        {FEATURES.map((f) => (
          <article key={f.title} className="feature" style={{ background: f.bg, color: f.fg }}>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} CareerCompass</span>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Project repository</a>
        <span>{COURSE_LABEL}</span>
      </footer>
    </>
  );
}