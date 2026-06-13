"use client";

import { useState } from "react";

export default function AnnonceSection({ announcements = {} }) {
  const [category, setCategory] = useState("");
  const [commercialBand, setCommercialBand] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [contactMode, setContactMode] = useState("");
  const [mail, setMail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isLeadSubmitted, setIsLeadSubmitted] = useState(false);
  const commercialListings = announcements.commerciales || [];
  const fondsListings = announcements.fonds || [];
  const sciListings = announcements.sci || [];

  const handleInterestedClick = () => {
    window.localStorage.setItem("bbg_creation_project_type", "reprise");
  };

  const resetContact = () => {
    setSelectedListing(null);
    setContactMode("");
    setMail("");
    setWhatsapp("");
    setLeadStatus("");
    setIsLeadSubmitted(false);
  };

  const buildRecapPayload = () => ({
    service: "Fusion / Acquisition",
    category,
    contactMode,
    mail,
    whatsapp,
    listing: selectedListing
  });

  const toAsciiText = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, " ")
      .trim();

  const escapePdfText = (value) => toAsciiText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const wrapText = (label, value, maxChars = 78) => {
    const fullText = `${label}: ${value}`.trim();

    if (fullText.length <= maxChars) {
      return [fullText];
    }

    const words = fullText.split(/\s+/);
    const wrapped = [];
    let currentLine = "";

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (nextLine.length > maxChars) {
        if (currentLine) {
          wrapped.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = nextLine;
      }
    }

    if (currentLine) {
      wrapped.push(currentLine);
    }

    return wrapped;
  };

  const buildProfessionalPdf = (payload) => {
    const content = [];
    let y = 735;
    const referenceId = `BBG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;

    const setFillColor = (r, g, b) => {
      content.push(`${r} ${g} ${b} rg`);
    };

    const addText = (text, x, size = 11, font = "F1") => {
      content.push("BT");
      content.push(`/${font} ${size} Tf`);
      content.push(`${x} ${y} Td`);
      content.push(`(${escapePdfText(text)}) Tj`);
      content.push("ET");
    };

    const moveDown = (amount) => {
      y -= amount;
    };

    const addDivider = () => {
      content.push("0.84 0.84 0.84 RG");
      content.push(`40 ${y} m 555 ${y} l S`);
      moveDown(16);
    };

    const addSectionTitle = (title) => {
      addText(title, 40, 12, "F2");
      moveDown(18);
    };

    const addField = (label, value) => {
      if (!value) {
        return;
      }

      const lines = wrapText(label, value);

      lines.forEach((line) => {
        addText(line, 40, 10, "F1");
        moveDown(14);
      });
    };

    setFillColor("0.4196", "0.3569", "0.3098");
    content.push("0 760 595 82 re f");

    const logoX = 40;
    const logoY = 772;
    const logoW = 120;
    const logoH = 54;

    setFillColor("0.4196", "0.3569", "0.3098");
    content.push(`${logoX} ${logoY} ${logoW} ${logoH} re f`);
    setFillColor("0.9608", "0.9412", "0.9216");

    y = logoY + 36;
    addText("B", logoX + 24, 20, "F2");
    y = logoY + 36;
    addText("B", logoX + 50, 20, "F2");
    y = logoY + 36;
    addText("G", logoX + 76, 20, "F2");

    content.push("0.9608 0.9412 0.9216 RG");
    content.push("0.8 w");
    content.push(`${logoX + 44} ${logoY + 14} m ${logoX + 44} ${logoY + 41} l S`);
    content.push(`${logoX + 70} ${logoY + 14} m ${logoX + 70} ${logoY + 41} l S`);

    y = logoY + 10;
    addText("COMPANY", logoX + 29, 8, "F1");

    setFillColor("0.9608", "0.9412", "0.9216");
    y = 804;
    addText("BBG COMPANY", 185, 18, "F2");
    y = 783;
    addText("Recapitulatif - Fusion / Acquisition", 185, 10, "F1");
    y = 798;
    addText(`Reference dossier: ${referenceId}`, 395, 10, "F1");

    setFillColor("0.1216", "0.1216", "0.1216");

    y = 735;
    addText(`Genere le ${new Date().toLocaleString("fr-FR")}`, 40, 9, "F1");
    moveDown(22);
    addDivider();

    addSectionTitle("1. Opportunite selectionnee");
    addField("Categorie", payload.category);
    addField("Titre", payload.listing?.title);
    addField("Ville", payload.listing?.city);
    addField("Prix", payload.listing?.price);
    addField("Description", payload.listing?.description);
    addDivider();

    addSectionTitle("2. Coordonnees client");
    addField("Preference de contact", payload.contactMode);
    addField("Email", payload.mail);
    addField("Telephone", payload.whatsapp);
    addDivider();

    addSectionTitle("3. Validation du dossier");

    const tableX = 40;
    const tableY = y;
    const tableWidth = 515;
    const headerHeight = 20;
    const rowHeight = 36;

    content.push("0.9 0.9 0.9 rg");
    content.push(`${tableX} ${tableY - headerHeight} ${tableWidth} ${headerHeight} re f`);
    content.push("0.62 0.62 0.62 RG");
    content.push(`${tableX} ${tableY} m ${tableX + tableWidth} ${tableY} l S`);
    content.push(`${tableX} ${tableY - headerHeight - rowHeight} m ${tableX + tableWidth} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX} ${tableY} m ${tableX} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX + tableWidth} ${tableY} m ${tableX + tableWidth} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX + 185} ${tableY} m ${tableX + 185} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX + 330} ${tableY} m ${tableX + 330} ${tableY - headerHeight - rowHeight} l S`);

    setFillColor("0.1216", "0.1216", "0.1216");
    y = tableY - 14;
    addText("Signature client", tableX + 10, 9, "F2");
    y = tableY - 14;
    addText("Date", tableX + 195, 9, "F2");
    y = tableY - 14;
    addText("Conseiller BBG", tableX + 340, 9, "F2");

    y = tableY - 38;
    addText("...............................", tableX + 10, 9, "F1");
    y = tableY - 38;
    addText("..... / ..... / ..........", tableX + 195, 9, "F1");
    y = tableY - 38;
    addText("...............................", tableX + 340, 9, "F1");

    y = 44;
    addText("Document genere automatiquement par BBG Company.", 40, 8, "F1");
    addText("Page 1/1", 515, 8, "F1");

    const stream = content.join("\n");
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n",
      `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((objectContent) => {
      offsets.push(pdf.length);
      pdf += objectContent;
    });

    const xrefPosition = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let index = 1; index <= objects.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

    return pdf;
  };

  const handleDownloadRecap = () => {
    const payload = buildRecapPayload();
    const pdfContent = buildProfessionalPdf(payload);
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-recap-fusion-acquisition-${dateStamp}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAnnouncementLeadSubmit = async () => {
    if (!selectedListing || !contactMode || !mail || !whatsapp) {
      setLeadStatus("Merci de renseigner votre email et votre téléphone avant l'envoi.");
      setIsLeadSubmitted(false);
      return;
    }

    setLeadStatus("");
    setIsLeadSubmitted(false);
    setIsSubmittingLead(true);

    const payload = {
      category,
      contactMode,
      mail,
      whatsapp,
      listing: selectedListing
    };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "ANNONCE",
        source: "annonce-section",
        email: mail,
        phone: whatsapp,
        payload
      })
    });

    setIsSubmittingLead(false);

    if (!response.ok) {
      setLeadStatus("Impossible d'enregistrer votre demande pour le moment.");
      setIsLeadSubmitted(false);
      return;
    }

    setIsLeadSubmitted(true);
    setLeadStatus("Votre intérêt a bien été enregistré. Un conseiller BBG Company vous recontactera rapidement.");
  };

  const visibleCommercialListings = commercialListings.filter((item) => item.priceBand === commercialBand);
  const visibleListings =
    category === "commerciales"
      ? visibleCommercialListings
      : category === "fonds"
        ? fondsListings
        : category === "sci"
          ? sciListings
          : [];

  return (
    <section className="section" id="annonces">
      <div className="container">
        <span className="kicker">Service 3</span>
        <h2 className="section-title">Fusion / Acquisition et reprise d'opportunités</h2>
        <p className="section-copy">
          Notre catalogue dynamique d'annonces vous permet de filtrer les opportunités, consulter les fiches détaillées et basculer directement vers le parcours de reprise.
        </p>
        <div className="inline-actions" style={{ marginBottom: 20 }}>
          <a className="btn btn-secondary" href="/annonces">
            Ouvrir le catalogue complet
          </a>
        </div>

        <div className="questionnaire-shell">
          <article className="form-card question-card">
            <div className="question-step">Étape 1</div>
            <h3>Choisissez le type d'opportunité que vous recherchez</h3>
            <div className="choice-group question-choices">
              <button className={`choice-pill ${category === "commerciales" ? "selected" : ""}`} onClick={() => { setCategory("commerciales"); setCommercialBand(""); resetContact(); }}>
                Sociétés commerciales
              </button>
              <button className={`choice-pill ${category === "fonds" ? "selected" : ""}`} onClick={() => { setCategory("fonds"); setCommercialBand(""); resetContact(); }}>
                Fonds de commerce
              </button>
              <button className={`choice-pill ${category === "sci" ? "selected" : ""}`} onClick={() => { setCategory("sci"); setCommercialBand(""); resetContact(); }}>
                Sociétés civiles immobilières
              </button>
            </div>
          </article>

          {category === "commerciales" && (
            <article className="form-card question-card">
              <div className="question-step">Étape 2</div>
              <p>
                Que vous soyez un investisseur expérimenté ou un entrepreneur en quête de nouvelles opportunités, notre sélection de sociétés commerciales à vendre vous offre une large gamme d'activités dans divers secteurs.
              </p>
              <h3>Quel niveau de prix vous intéresse ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${commercialBand === "moins-5000" ? "selected" : ""}`} onClick={() => { setCommercialBand("moins-5000"); resetContact(); }}>
                  - 5000 €
                </button>
                <button className={`choice-pill ${commercialBand === "plus-5000" ? "selected" : ""}`} onClick={() => { setCommercialBand("plus-5000"); resetContact(); }}>
                  + 5000 €
                </button>
              </div>
            </article>
          )}

          {category === "fonds" && (
            <article className="form-card question-card result-card">
              <div className="question-step">Fonds de commerce</div>
              <p>
                Vous cherchez à reprendre une activité clé en main avec un potentiel de croissance ? Notre sélection de fonds de commerce à vendre vous permet de démarrer rapidement avec une clientèle établie et des équipements opérationnels.
              </p>
            </article>
          )}

          {category === "sci" && (
            <article className="form-card question-card result-card">
              <div className="question-step">Sociétés civiles immobilières</div>
              <p>
                Découvrez des SCI avec informations détaillées sur le patrimoine, les revenus et le potentiel de valorisation afin d'évaluer rapidement les opportunités les plus pertinentes.
              </p>
            </article>
          )}

          {((category === "commerciales" && commercialBand) || category === "fonds" || category === "sci") && (
            <article className="form-card question-card">
              <div className="question-step">Étape 3</div>
              <h3>Annonces disponibles</h3>
              <div className="annonce-grid">
                {visibleListings.map((item) => (
                  <article className="annonce-card" key={`${category}-${item.id}`}>
                    <span className="tag">{item.city}</span>
                    <h3>{item.title}</h3>
                    <p>Prix : {item.price}</p>
                    <div className="inline-actions" style={{ marginTop: 18 }}>
                      {category === "commerciales" ? (
                        <>
                          <a className="btn btn-primary" href="#creation" onClick={handleInterestedClick}>
                            Je suis intéressé
                          </a>
                          <a className="btn btn-outline" href={`/annonces/${item.slug}`}>
                            Voir la fiche
                          </a>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-primary" onClick={() => { setSelectedListing(item); setContactMode(""); setMail(""); setWhatsapp(""); setLeadStatus(""); }}>
                            Voir l'annonce
                          </button>
                          <a className="btn btn-outline" href={`/annonces/${item.slug}`}>
                            Fiche complète
                          </a>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {visibleListings.length === 0 && (
                <div className="subsection notice">
                  Aucune annonce publiée ne correspond à ce filtre pour le moment.
                </div>
              )}

              {category === "commerciales" && (
                <div className="subsection notice">
                  Si vous êtes intéressé par une annonce, cliquez sur <strong>Je suis intéressé</strong> : vous serez renvoyé dans la page création pour choisir <strong>Reprise d'une de nos annonces</strong>, remplir le formulaire, puis finaliser votre dossier dans votre espace client.
                </div>
              )}
            </article>
          )}

          {selectedListing && category === "fonds" && (
            <article className="form-card question-card result-card" id="fiche-annonce">
              <div className="question-step">Fiche annonce</div>
              <h3>{selectedListing.title}</h3>
              <p>
                {selectedListing.description}
              </p>

              <div className="subsection">
                <h3>Souhaitez-vous être contacté par mail ou téléphone ?</h3>
                <div className="choice-group question-choices">
                  <button className={`choice-pill ${contactMode === "mail" ? "selected" : ""}`} onClick={() => setContactMode("mail")}>
                    Mail
                  </button>
                  <button className={`choice-pill ${contactMode === "whatsapp" ? "selected" : ""}`} onClick={() => setContactMode("whatsapp")}>
                    Téléphone
                  </button>
                </div>
              </div>

              {contactMode === "mail" && (
                <div className="subsection notice">
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={mail} onChange={(event) => setMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
                  </div>
                  <p>
                    Contactez-nous à <strong>annonces@bbg-company.fr</strong> vous recevrez un retour en moins d'une heure.
                  </p>
                </div>
              )}

              {contactMode === "whatsapp" && (
                <div className="subsection notice">
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={mail} onChange={(event) => setMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
                  </div>
                  <p>Vous recevrez un appel ou un message dans moins d'une heure.</p>
                </div>
              )}

              <div className="subsection inline-actions">
                <button className="btn btn-primary" type="button" onClick={handleAnnouncementLeadSubmit} disabled={isSubmittingLead}>
                  {isSubmittingLead ? "Enregistrement..." : "Enregistrer mon intérêt"}
                </button>
                {isLeadSubmitted && (
                  <button className="btn btn-outline" type="button" onClick={handleDownloadRecap}>
                    Télécharger mon récapitulatif (PDF)
                  </button>
                )}
              </div>
              {leadStatus && <div className="subsection notice">{leadStatus}</div>}
            </article>
          )}

          {selectedListing && category === "sci" && (
            <article className="form-card question-card result-card" id="fiche-annonce">
              <div className="question-step">Fiche annonce</div>
              <h3>{selectedListing.title}</h3>
              <p>
                {selectedListing.description}
              </p>
              {Array.isArray(selectedListing.details?.highlights) && selectedListing.details.highlights.length > 0 && (
                <ul className="list-clean">
                  {selectedListing.details.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}

              <div className="subsection">
                <h3>Souhaitez-vous être contacté par mail ou téléphone ?</h3>
                <div className="choice-group question-choices">
                  <button className={`choice-pill ${contactMode === "mail" ? "selected" : ""}`} onClick={() => setContactMode("mail")}>
                    Mail
                  </button>
                  <button className={`choice-pill ${contactMode === "whatsapp" ? "selected" : ""}`} onClick={() => setContactMode("whatsapp")}>
                    Téléphone
                  </button>
                </div>
              </div>

              {contactMode === "mail" && (
                <div className="subsection notice">
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={mail} onChange={(event) => setMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
                  </div>
                  <p>
                    Contactez-nous à <strong>annonces@bbg-company.fr</strong> vous recevrez un retour en moins d'une heure.
                  </p>
                </div>
              )}

              {contactMode === "whatsapp" && (
                <div className="subsection notice">
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={mail} onChange={(event) => setMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
                  </div>
                  <p>Vous recevrez un appel ou un message dans moins d'une heure.</p>
                </div>
              )}

              <div className="subsection inline-actions">
                <button className="btn btn-primary" type="button" onClick={handleAnnouncementLeadSubmit} disabled={isSubmittingLead}>
                  {isSubmittingLead ? "Enregistrement..." : "Enregistrer mon intérêt"}
                </button>
                {isLeadSubmitted && (
                  <button className="btn btn-outline" type="button" onClick={handleDownloadRecap}>
                    Télécharger mon récapitulatif (PDF)
                  </button>
                )}
              </div>
              {leadStatus && <div className="subsection notice">{leadStatus}</div>}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
