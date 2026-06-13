"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function SiteHeader({
  light = false,
  notificationCount = 0,
  showNotificationCount = false,
  hideSiteNav = false,
  notificationHref = ""
}) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/connexion" });
  };

  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/">
          <img src="/logo-bbg.svg" alt="BBG Company" className="brand-logo" />
          <div className="brand-text">
            <strong>BBG Company</strong>
            <span>{light ? "Espace client" : "Cabinet de conseil"}</span>
          </div>
        </Link>

        {!hideSiteNav && (
          <nav className="nav-links">
            <a href="/services">Services</a>
            <a href="/gestion">Gestion</a>
            <a href="/creation">Création</a>
            <a href="/annonces">Fusion / Acquisition</a>
            <a href="/contact">Contact</a>
            <Link href="/a-propos">À propos</Link>
          </nav>
        )}

        <div className="nav-actions">
          {light ? (
            <>
              {showNotificationCount &&
                (notificationHref ? (
                  <Link
                    className="notification-pill"
                    href={notificationHref}
                    aria-label={`Notifications non lues: ${notificationCount}`}
                  >
                    Notifications
                    <span className="notification-badge">{notificationCount}</span>
                  </Link>
                ) : (
                  <div className="notification-pill" aria-label={`Notifications non lues: ${notificationCount}`}>
                    Notifications
                    <span className="notification-badge">{notificationCount}</span>
                  </div>
                ))}
              <Link className="btn btn-secondary" href="/">
                Retour au site
              </Link>
              <button className="btn btn-outline" type="button" onClick={handleSignOut}>
                Déconnecter
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary hidden-mobile" href="/espace-client">
                Espace client
              </Link>
              <a className="btn btn-primary" href="/contact">
                Prendre contact
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
