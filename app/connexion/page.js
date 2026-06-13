import LoginForm from "@/components/LoginForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Suspense } from "react";

export const metadata = {
  title: "BBG Company - Connexion",
  description: "Connexion sécurisée à l'espace client BBG Company."
};

export default function ConnexionPage() {
  return (
    <div className="light-page">
      <SiteHeader light />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 720 }}>
            <span className="kicker">Espace sécurisé</span>
            <h1 className="section-title">Connectez-vous à votre espace BBG Company.</h1>
            <p className="section-copy">Cette zone est réservée aux clients disposant d'un accès personnel.</p>
            <Suspense fallback={<div className="form-card">Chargement du formulaire de connexion...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
