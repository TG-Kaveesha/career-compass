import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { COURSE_LABEL, REPO_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { title: "Skill Gap Analysis", text: "Compare your skills with real role requirements.", bg: "#EADCCB", fg: "#5C4033" },
  { title: "Interactive Milestone Boards", text: "Plan, start and finish learning tasks on a board.", bg: "#D9C2A8", fg: "#3E2C23" },
  { title: "Resource Bookmarks", text: "Save videos, articles and docs against each skill.", bg: "#F0E2D0", fg: "#5C4033" },
  { title: "Analytics & Readiness Score", text: "Watch one score rise as you close gaps.", bg: "#E3CFB8", fg: "#3E2C23" },
];

export default function Landing() {
  const HERO_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"];
  const SLIDE_SECONDS = 4;
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
        <div className="hero-slides" aria-hidden="true">
            {HERO_IMAGES.map((src, i) => (
              <div
                key={src}
                className="hero-slide"
                style={{
                  backgroundImage: `url(${src})`,
                  animationDuration: `${HERO_IMAGES.length * SLIDE_SECONDS}s`,
                  animationDelay: `${i * SLIDE_SECONDS}s`,
                }}
              />
           ))}
        </div>
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