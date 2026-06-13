import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "BBG Company - À propos",
  description: "Découvrez la mission et l'accompagnement proposé par BBG Company."
};

export default function AProposPage() {
  return (
    <div className="light-page">
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 900 }}>
            <span className="kicker">À propos</span>
            <h1 className="section-title">BBG Company accompagne les dirigeants à chaque étape.</h1>
            <p className="section-copy">
              Notre cabinet intervient sur la gestion, la création et la reprise d'entreprise avec une approche pragmatique,
              structurée et orientée résultats.
            </p>

            <div className="form-card" style={{ marginTop: 24 }}>
              <h3>Notre mission</h3>
              <p>
                Simplifier les démarches des entrepreneurs et leur offrir un accompagnement fiable, de l'idée initiale jusqu'au
                suivi opérationnel.
              </p>

              <h3 style={{ marginTop: 20 }}>Nos expertises</h3>
              <ul className="list-clean">
                <li>Gestion RH et comptable</li>
                <li>Création d'entreprise et structuration juridique</li>
                <li>Fusion / acquisition et reprise d'opportunités</li>
              </ul>

              <h3 style={{ marginTop: 20 }}>Notre méthode</h3>
              <p>
                Un interlocuteur dédié, des étapes claires, et un suivi digitalisé via l'espace client pour garder une vision
                continue de l'avancement de votre dossier.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
