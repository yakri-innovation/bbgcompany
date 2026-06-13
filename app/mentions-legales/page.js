import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "BBG Company - Mentions légales",
  description: "Mentions légales du site BBG Company."
};

export default function MentionsLegalesPage() {
  return (
    <div className="light-page">
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 900 }}>
            <span className="kicker">Mentions légales</span>
            <h1 className="section-title">Informations légales</h1>

            <div className="form-card" style={{ marginTop: 24 }}>
              <h3>Éditeur du site</h3>
              <p>
                BBG Company<br />
                Email : contact@bbg-company.fr
              </p>

              <h3 style={{ marginTop: 20 }}>Hébergement</h3>
              <p>
                Hébergeur de l'application : à compléter selon votre environnement de production.
              </p>

              <h3 style={{ marginTop: 20 }}>Propriété intellectuelle</h3>
              <p>
                Les contenus présents sur ce site (textes, éléments visuels, logos, structure) sont protégés. Toute reproduction
                totale ou partielle sans autorisation écrite préalable est interdite.
              </p>

              <h3 style={{ marginTop: 20 }}>Contact</h3>
              <p>
                Pour toute question concernant le site ou son contenu : contact@bbg-company.fr
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
