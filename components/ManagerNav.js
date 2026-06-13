"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    label: "Pilotage",
    items: [
      { href: "/manager", label: "Tableau de bord", icon: "grid", exact: true },
      { href: "/manager/dossiers", label: "Dossiers", icon: "folder" }
    ]
  },
  {
    label: "Traitement",
    items: [
      { href: "/manager/documents", label: "Documents", icon: "file" },
      { href: "/manager/notifications", label: "Notifications", icon: "bell" }
    ]
  }
];

const icons = {
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  folder: "M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z",
  file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zm0 0v6h6",
  bell: "M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m2 0v1a2 2 0 1 0 4 0v-1"
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name] || icons.grid} />
    </svg>
  );
}

export default function ManagerNav() {
  const pathname = usePathname();

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav className="admin-nav" aria-label="Navigation manager">
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
