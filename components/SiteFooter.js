import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-card">
          <h4>BBG Company</h4>
          <p>Conseil &amp; accompagnement des entreprises.</p>
        </div>
        <div className="footer-card">
          <h4>Services</h4>
          <p>
            <a href="/gestion">Gestion</a>
            <br />
            <a href="/creation">Création</a>
            <br />
            <a href="/annonces">Fusion / Acquisition</a>
          </p>
        </div>
        <div className="footer-card">
          <h4>Plateforme</h4>
          <p>
            <Link href="/espace-client">Espace client</Link>
            <br />
            <a href="/contact">Contact</a>
            <br />
            <a href="/#top">Retour en haut</a>
            <br />
            <Link href="/mentions-legales">Mentions légales</Link>
            <br />
            <Link href="/politique-confidentialite">Politique de confidentialité</Link>
          </p>
        </div>
        <div className="footer-card">
          <h4>Contact rapide</h4>
          <p>
            RH@bbg-company.fr
            <br />
            compta@bbg-company.fr
            <br />
            annonces@bbg-company.fr
          </p>
        </div>
      </div>
    </footer>
  );
}
