import { ReactNode, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assessor", label: "Skill Gap Assessor" },
  { to: "/milestones", label: "Milestones Board" },
  { to: "/resources", label: "Resource Hub" },
  { to: "/profile", label: "Profile Settings" },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="shell">
      <div className={`scrim${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <Logo />
        <nav aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={async () => { await logout(); navigate("/"); }}>Log out</button>
      </aside>
      <main className="main">
        <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰ Menu</button>
        <Outlet />
      </main>
    </div>
  );
}

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}
export function PageHeader({ title, subtitle, children }: HeaderProps) {
  const { user } = useAuth();
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="head-right">
        {children}
        <span className="chip">Target: {user?.targetRole.name}</span>
        <span className="avatar" aria-label={user?.name}>{user?.name.charAt(0).toUpperCase()}</span>
      </div>
    </header>
  );
}