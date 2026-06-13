import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "BBG Company - Politique de confidentialité",
  description: "Politique de confidentialité et protection des données personnelles de BBG Company."
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="light-page">
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 900 }}>
            <span className="kicker">Confidentialité</span>
            <h1 className="section-title">Politique de confidentialité</h1>

            <div className="form-card" style={{ marginTop: 24 }}>
              <h3>Données collectées</h3>
              <p>
                Nous collectons les informations nécessaires au traitement de vos demandes : identité, coordonnées, éléments
                relatifs à vos projets et interactions avec nos services.
              </p>

              <h3 style={{ marginTop: 20 }}>Finalités du traitement</h3>
              <p>
                Les données sont utilisées pour répondre à vos demandes, gérer vos dossiers, assurer le suivi administratif,
                contractuel et améliorer la qualité de nos services.
              </p>

              <h3 style={{ marginTop: 20 }}>Durée de conservation</h3>
              <p>
                Les données sont conservées pendant la durée strictement nécessaire aux finalités poursuivies et aux obligations
                légales applicables.
              </p>

              <h3 style={{ marginTop: 20 }}>Vos droits</h3>
              <p>
                Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition au traitement de
                vos données, ainsi que du droit à la portabilité lorsque applicable.
              </p>

              <h3 style={{ marginTop: 20 }}>Exercer vos droits</h3>
              <p>
                Pour toute demande relative à vos données personnelles : privacy@bbg-company.fr
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
