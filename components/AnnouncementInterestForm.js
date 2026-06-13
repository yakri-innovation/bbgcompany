"use client";

import { useState } from "react";

export default function AnnouncementInterestForm({ announcement }) {
  const [contactMode, setContactMode] = useState("mail");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");

    if (!email || !whatsapp) {
      setStatus("Merci de renseigner votre email et votre téléphone.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "ANNONCE",
        source: "announcement-detail",
        email,
        phone: whatsapp,
        payload: {
          contactMode,
          message,
          listing: {
            id: announcement.id,
            title: announcement.title,
            slug: announcement.slug,
            category: announcement.category,
            city: announcement.city,
            price: announcement.price
          }
        }
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus("Impossible d'enregistrer votre demande pour le moment.");
      return;
    }

    setStatus("Votre demande a bien été envoyée. Un conseiller BBG Company vous recontacte rapidement.");
  };

  const handleCreationRedirect = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bbg_creation_project_type", "reprise");
    }
  };

  return (
    <article className="dashboard-card">
      <h3>Je suis intéressé par cette annonce</h3>
      <p>Choisissez votre mode de contact puis envoyez votre demande.</p>

      <form className="table-like" onSubmit={handleSubmit}>
        <div className="field">
          <label>Mode de contact</label>
          <select value={contactMode} onChange={(event) => setContactMode(event.target.value)}>
            <option value="mail">Mail</option>
            <option value="whatsapp">Téléphone</option>
          </select>
        </div>

        {contactMode === "mail" ? (
          <>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@entreprise.fr"
                required
              />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="06 12 34 56 78"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@entreprise.fr"
                required
              />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="06 12 34 56 78"
                required
              />
            </div>
          </>
        )}

        <div className="field">
          <label>Message (optionnel)</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Précisez votre besoin ou vos questions"
          />
        </div>

        <div className="inline-actions">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
          </button>
          <a className="btn btn-secondary" href="/creation" onClick={handleCreationRedirect}>
            Lancer un dossier de reprise
          </a>
        </div>
      </form>

      {status && <div className="notice" style={{ marginTop: 16 }}>{status}</div>}
    </article>
  );
}
