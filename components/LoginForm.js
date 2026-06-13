"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const hasExplicitCallback = Boolean(callbackUrl);
  const fallbackUrl = callbackUrl || "/espace-client";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: fallbackUrl
      });

      if (!result || result.error) {
        setError("Identifiants incorrects ou compte non activé.");
        setIsSubmitting(false);
        return;
      }

      if (hasExplicitCallback) {
        router.push(result.url || fallbackUrl);
        router.refresh();
        return;
      }

      const sessionResponse = await fetch("/api/auth/session");
      const session = sessionResponse.ok ? await sessionResponse.json() : null;
      const role = session?.user?.role;

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (role === "MANAGER") {
        router.push("/manager");
      } else {
        router.push("/espace-client");
      }

      router.refresh();
    } catch (requestError) {
      setError("Connexion impossible pour le moment. Merci de réessayer.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Connexion à votre espace client</h3>
        <p>Accédez à vos dossiers, documents, paiements et échanges avec votre conseiller BBG Company.</p>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@entreprise.fr"
              required
              suppressHydrationWarning
            />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe"
              required
              suppressHydrationWarning
            />
          </div>
        </div>
        <div className="subsection inline-actions">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </button>
          <a className="btn btn-secondary" href="/contact">
            Demander un accès
          </a>
        </div>
      </form>

      {isSubmitting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Connexion en cours"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(16, 20, 25, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 16
          }}
        >
          <div
            style={{
              width: "min(460px, 100%)",
              background: "var(--card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--line)",
              boxShadow: "0 22px 60px rgba(15, 23, 42, 0.28)",
              padding: 20
            }}
          >
            <h3 style={{ margin: 0 }}>Connexion en cours...</h3>
            <p style={{ margin: "10px 0 0" }}>Merci de patienter pendant le chargement de votre espace.</p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Erreur de connexion"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 121,
            background: "rgba(16, 20, 25, 0.45)",
            display: "grid",
            placeItems: "center",
            padding: 16
          }}
          onClick={() => setError("")}
        >
          <div
            style={{
              width: "min(460px, 100%)",
              background: "var(--card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--line)",
              boxShadow: "0 22px 60px rgba(15, 23, 42, 0.28)",
              padding: 20
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>Connexion impossible</h3>
            <p style={{ margin: "10px 0 16px" }}>{error}</p>
            <div className="inline-actions">
              <button className="btn btn-primary" type="button" onClick={() => setError("")}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
