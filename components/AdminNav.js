"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    label: "Pilotage",
    items: [
      { href: "/admin", label: "Tableau de bord", icon: "grid", exact: true },
      { href: "/admin/affectations", label: "Affectations", icon: "users" }
    ]
  },
  {
    label: "Activité commerciale",
    items: [
      { href: "/admin/prospects", label: "Prospects", icon: "target" },
      { href: "/admin/annonces", label: "Annonces", icon: "megaphone" }
    ]
  },
  {
    label: "Dossiers & finances",
    items: [
      { href: "/admin/documents", label: "Documents", icon: "file" },
      { href: "/admin/paiements", label: "Paiements", icon: "card" }
    ]
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/equipe", label: "Équipe", icon: "shield" },
      { href: "/admin/clients", label: "Clients", icon: "contact" },
      { href: "/admin/audit", label: "Journal d'audit", icon: "history" }
    ]
  }
];

const icons = {
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  users: "M16 11a4 4 0 1 0-3.2-6.4M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0c-3 0-6 1.5-6 4.5V19h12v-3.5C14 12.5 11 11 8 11zm8 0c2.5 0 6 1.2 6 4.5V19h-5",
  target: "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0zm0 0m-5 0a5 5 0 1 0 10 0 5 5 0 1 0-10 0zm5 0m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0z",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1zm13-4.5v11a4 4 0 0 0 0-11z",
  file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zm0 0v6h6",
  card: "M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm0 4h18",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z",
  contact: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm5 5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0zm-1 7c0-2 2-3 3.5-3s3.5 1 3.5 3",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3.5 2"
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name] || icons.grid} />
    </svg>
  );
}

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav className="admin-nav" aria-label="Navigation administration">
      {navSections.map((section) => (
        <div className="admin-nav-section" key={section.label}>
          <span className="admin-nav-title">{section.label}</span>
          <div className="admin-nav-items">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${isActive(item) ? " is-active" : ""}`}
                aria-current={isActive(item) ? "page" : undefined}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
