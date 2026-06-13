"use client";

import { useState, useEffect, useRef } from "react";

export default function GestionSection() {
  const [service, setService] = useState("");
  const [rhHasEmployees, setRhHasEmployees] = useState("");
  const [rhDomain, setRhDomain] = useState("");
  const [rhContact, setRhContact] = useState("");
  const [rhMail, setRhMail] = useState("");
  const [rhWhatsapp, setRhWhatsapp] = useState("");
  const [comptaUpToDate, setComptaUpToDate] = useState("");
  const [comptaDomain, setComptaDomain] = useState("");
  const [comptaContact, setComptaContact] = useState("");
  const [comptaMail, setComptaMail] = useState("");
  const [comptaWhatsapp, setComptaWhatsapp] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isLeadSubmitted, setIsLeadSubmitted] = useState(false);

  // Refs pour le scroll automatique
  const rhStep1Ref = useRef(null);
  const rhStep2Ref = useRef(null);
  const rhStep3Ref = useRef(null);
  const rhStep4Ref = useRef(null);
  const comptaStep1Ref = useRef(null);
  const comptaStep2Ref = useRef(null);
  const comptaStep3Ref = useRef(null);
  const comptaStep4Ref = useRef(null);

  // Fonction de scroll fluide
  const scrollToRef = (ref) => {
    if (ref?.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  // Handlers avec scroll automatique
  const handleServiceSelect = (value) => {
    setService(value);
    setRhHasEmployees("");
    setRhDomain("");
    setRhContact("");
    setRhMail("");
    setRhWhatsapp("");
    setComptaUpToDate("");
    setComptaDomain("");
    setComptaContact("");
    setComptaMail("");
    setComptaWhatsapp("");
    setLeadStatus("");
    setIsLeadSubmitted(false);
    setTimeout(() => {
      if (value === "rh") scrollToRef(rhStep1Ref);
      if (value === "compta") scrollToRef(comptaStep1Ref);
    }, 150);
  };

  const handleRhHasEmployees = (value) => {
    setRhHasEmployees(value);
    setTimeout(() => scrollToRef(rhStep2Ref), 150);
  };

  const handleRhDomainChange = (e) => {
    setRhDomain(e.target.value);
    if (e.target.value) {
      setTimeout(() => scrollToRef(rhStep3Ref), 150);
    }
  };

  const handleRhContact = (value) => {
    setRhContact(value);
    setTimeout(() => scrollToRef(rhStep4Ref), 150);
  };

  const handleComptaUpToDate = (value) => {
    setComptaUpToDate(value);
    setTimeout(() => scrollToRef(comptaStep2Ref), 150);
  };

  const handleComptaDomainChange = (e) => {
    setComptaDomain(e.target.value);
    if (e.target.value) {
      setTimeout(() => scrollToRef(comptaStep3Ref), 150);
    }
  };

  const handleComptaContact = (value) => {
    setComptaContact(value);
    setTimeout(() => scrollToRef(comptaStep4Ref), 150);
  };

  const canSubmitGestion =
    service === "rh"
      ? rhHasEmployees && rhDomain && rhContact && rhMail && rhWhatsapp
      : service === "compta"
        ? comptaUpToDate && comptaDomain && comptaContact && comptaMail && comptaWhatsapp
        : false;

  const buildRecapPayload = () =>
    service === "rh"
      ? {
          service: "Gestion RH",
          hasEmployees: rhHasEmployees,
          domain: rhDomain,
          contactPreference: rhContact,
          email: rhMail,
          phone: rhWhatsapp
        }
      : {
          service: "Gestion comptable",
          accountingUpToDate: comptaUpToDate,
          domain: comptaDomain,
          contactPreference: comptaContact,
          email: comptaMail,
          phone: comptaWhatsapp
        };

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

  const buildGestionPdf = (payload) => {
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
    addText("Recapitulatif - Gestion d'entreprise", 185, 10, "F1");
    y = 798;
    addText(`Reference dossier: ${referenceId}`, 395, 10, "F1");

    setFillColor("0.1216", "0.1216", "0.1216");

    y = 735;
    addText(`Genere le ${new Date().toLocaleString("fr-FR")}`, 40, 9, "F1");
    moveDown(22);
    addDivider();

    addSectionTitle("1. Informations du service");
    addField("Service choisi", payload.service);
    addField("Domaine d activite", payload.domain);
    addField("Preference de contact", payload.contactPreference);
    addDivider();

    addSectionTitle("2. Qualification du besoin");
    if (payload.service === "Gestion RH") {
      addField("A des employes", payload.hasEmployees);
    } else {
      addField("Comptabilite a jour", payload.accountingUpToDate);
    }
    addDivider();

    addSectionTitle("3. Coordonnees client");
    addField("Email", payload.email);
    addField("Telephone", payload.phone);

    if (y < 190) {
      y = 190;
    }

    moveDown(6);
    addSectionTitle("4. Validation du dossier");

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
    const pdfContent = buildGestionPdf(payload);
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-recap-gestion-${dateStamp}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLeadSubmit = async () => {
    if (!canSubmitGestion) {
      setLeadStatus("Merci de compléter le parcours avant l'envoi.");
      return;
    }

    setLeadStatus("");
    setIsSubmittingLead(true);

    const payload =
      service === "rh"
        ? {
            service,
            hasEmployees: rhHasEmployees,
            domain: rhDomain,
            contactPreference: rhContact,
            email: rhMail,
            whatsapp: rhWhatsapp
          }
        : {
            service,
            accountingUpToDate: comptaUpToDate,
            domain: comptaDomain,
            contactPreference: comptaContact,
            email: comptaMail,
            whatsapp: comptaWhatsapp
          };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: service === "rh" ? "GESTION_RH" : "GESTION_COMPTA",
        source: "gestion-section",
        email: service === "rh" ? rhMail : comptaMail,
        phone: service === "rh" ? rhWhatsapp : comptaWhatsapp,
        payload
      })
    });

    setIsSubmittingLead(false);

    if (!response.ok) {
      setLeadStatus("Impossible d'enregistrer votre demande pour le moment.");
      return;
    }

    setIsLeadSubmitted(true);
    setLeadStatus("Votre demande a bien été enregistrée. Un conseiller BBG Company vous recontactera rapidement.");
  };

  return (
    <section className="section" id="gestion">
      <div className="container">
        <span className="kicker">Service 1</span>
        <h2 className="section-title">Gestion de votre entreprise</h2>
        <p className="section-copy">
          Notre service de gestion vous accompagne dans toutes les étapes administratives de votre entreprise, de la gestion des déclarations sociales à la paie et au soutien comptable.
        </p>

        <div className="questionnaire-shell">
          <article className="form-card question-card" id="gestion-step-1" tabIndex={-1}>
            <div className="question-step">Étape 1</div>
            <h3>Avez-vous besoin d'accompagnement pour vos ressources humaines ou pour votre comptabilité ?</h3>
            <div className="choice-group question-choices">
              <button className={`choice-pill ${service === "rh" ? "selected" : ""}`} onClick={() => handleServiceSelect("rh")}>
                Ressources humaines
              </button>
              <button className={`choice-pill ${service === "compta" ? "selected" : ""}`} onClick={() => handleServiceSelect("compta")}>
                Comptabilité
              </button>
            </div>
          </article>

          {service === "rh" && (
            <div className="questionnaire-stack">
              <article className="form-card question-card result-card" ref={rhStep1Ref}>
                <div className="question-step">Si ressources humaines</div>
                <p>Notre service RH vous accompagne sur vos obligations sociales, vos fiches de paie et l'organisation de vos ressources humaines.</p>
              </article>

              <article className="form-card question-card" ref={rhStep2Ref}>
                <div className="question-step">Étape 2</div>
                <h3>Avez-vous déjà des employés ?</h3>
                <div className="choice-group question-choices">
                  <button className={`choice-pill ${rhHasEmployees === "oui" ? "selected" : ""}`} onClick={() => handleRhHasEmployees("oui")}>
                    Oui
                  </button>
                  <button className={`choice-pill ${rhHasEmployees === "pas-encore" ? "selected" : ""}`} onClick={() => handleRhHasEmployees("pas-encore")}>
                    Pas encore
                  </button>
                </div>
              </article>

              {rhHasEmployees && (
                <article className="form-card question-card" ref={rhStep3Ref}>
                  <div className="question-step">Étape 3</div>
                  <h3>Quel est votre domaine d'activité ?</h3>
                  <div className="field question-field-single">
                    <select value={rhDomain} onChange={handleRhDomainChange}>
                      <option value="">Sélectionnez votre domaine</option>
                      <option value="BTP / Transport">BTP / Transport</option>
                      <option value="Service à la personne">Service à la personne</option>
                      <option value="Banque et assurance">Banque et assurance</option>
                      <option value="Administratif">Administratif</option>
                      <option value="Autres">Autres</option>
                    </select>
                  </div>
                </article>
              )}

              {rhDomain && (
                <article className="form-card question-card" ref={rhStep4Ref}>
                  <div className="question-step">Étape 4</div>
                  <h3>Préférez-vous échanger par mail ou téléphone ?</h3>
                  <div className="choice-group question-choices">
                    <button className={`choice-pill ${rhContact === "mail" ? "selected" : ""}`} onClick={() => handleRhContact("mail")}>
                      Mail
                    </button>
                    <button className={`choice-pill ${rhContact === "whatsapp" ? "selected" : ""}`} onClick={() => handleRhContact("whatsapp")}>
                      Téléphone
                    </button>
                  </div>
                </article>
              )}

              {rhContact === "mail" && (
                <article className="form-card question-card result-card">
                  <div className="question-step">Réponse 1-3a</div>
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={rhMail} onChange={(event) => setRhMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={rhWhatsapp} onChange={(event) => setRhWhatsapp(event.target.value)} />
                  </div>
                  <p>
                    Contactez-nous à <strong>RH@bbg-company.fr</strong> vous recevrez un retour en moins d'une heure.
                  </p>
                </article>
              )}

              {rhContact === "whatsapp" && (
                <article className="form-card question-card result-card">
                  <div className="question-step">Réponse 1-3b</div>
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={rhMail} onChange={(event) => setRhMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={rhWhatsapp} onChange={(event) => setRhWhatsapp(event.target.value)} />
                  </div>
                  <p>Vous recevrez un appel ou un message dans moins d'une heure.</p>
                </article>
              )}
            </div>
          )}

          {service === "compta" && (
            <div className="questionnaire-stack">
              <article className="form-card question-card result-card" ref={comptaStep1Ref}>
                <div className="question-step">Si comptabilité</div>
                <p>Nous vous accompagnons dans la gestion de votre comptabilité et de vos déclarations fiscales avec un premier niveau de qualification.</p>
              </article>

              <article className="form-card question-card" ref={comptaStep2Ref}>
                <div className="question-step">Étape 2</div>
                <h3>Votre société est-elle à jour de sa comptabilité et de ses déclarations fiscales ?</h3>
                <div className="choice-group question-choices">
                  <button className={`choice-pill ${comptaUpToDate === "oui" ? "selected" : ""}`} onClick={() => handleComptaUpToDate("oui")}>
                    Oui
                  </button>
                  <button className={`choice-pill ${comptaUpToDate === "non" ? "selected" : ""}`} onClick={() => handleComptaUpToDate("non")}>
                    Non
                  </button>
                </div>
              </article>

              {comptaUpToDate && (
                <article className="form-card question-card" ref={comptaStep3Ref}>
                  <div className="question-step">Étape 3</div>
                  <h3>Quel est votre domaine d'activité ?</h3>
                  <div className="field question-field-single">
                    <select value={comptaDomain} onChange={handleComptaDomainChange}>
                      <option value="">Sélectionnez votre domaine</option>
                      <option value="BTP / Transport">BTP / Transport</option>
                      <option value="Service à la personne">Service à la personne</option>
                      <option value="Banque et assurance">Banque et assurance</option>
                      <option value="Administratif">Administratif</option>
                      <option value="Autres">Autres</option>
                    </select>
                  </div>
                </article>
              )}

              {comptaDomain && (
                <article className="form-card question-card" ref={comptaStep4Ref}>
                  <div className="question-step">Étape 4</div>
                  <h3>Préférez-vous échanger par mail ou téléphone ?</h3>
                  <div className="choice-group question-choices">
                    <button className={`choice-pill ${comptaContact === "mail" ? "selected" : ""}`} onClick={() => handleComptaContact("mail")}>
                      Mail
                    </button>
                    <button className={`choice-pill ${comptaContact === "whatsapp" ? "selected" : ""}`} onClick={() => handleComptaContact("whatsapp")}>
                      Téléphone
                    </button>
                  </div>
                </article>
              )}

              {comptaContact === "mail" && (
                <article className="form-card question-card result-card">
                  <div className="question-step">Réponse 2-3a</div>
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={comptaMail} onChange={(event) => setComptaMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={comptaWhatsapp} onChange={(event) => setComptaWhatsapp(event.target.value)} />
                  </div>
                  <p>
                    Contactez-nous à <strong>compta@bbg-company.fr</strong> vous recevrez un retour en moins d'une heure.
                  </p>
                </article>
              )}

              {comptaContact === "whatsapp" && (
                <article className="form-card question-card result-card">
                  <div className="question-step">Réponse 2-3b</div>
                  <div className="field question-field-single">
                    <label>Quel est votre mail ?</label>
                    <input type="email" placeholder="vous@entreprise.fr" value={comptaMail} onChange={(event) => setComptaMail(event.target.value)} />
                  </div>
                  <div className="field question-field-single">
                    <label>Indiquez votre numéro de téléphone</label>
                    <input type="tel" placeholder="06 00 00 00 00" value={comptaWhatsapp} onChange={(event) => setComptaWhatsapp(event.target.value)} />
                  </div>
                  <p>Vous recevrez un appel ou un message dans moins d'une heure.</p>
                </article>
              )}
            </div>
          )}

          {leadStatus && <div className="subsection notice">{leadStatus}</div>}

          <div className="subsection inline-actions">
            <button className="btn btn-primary" type="button" onClick={handleLeadSubmit} disabled={isSubmittingLead || isLeadSubmitted}>
              {isSubmittingLead ? "Enregistrement..." : isLeadSubmitted ? "Enregistré" : "Être accompagné"}
            </button>
            {isLeadSubmitted && (
              <button className="btn btn-outline" type="button" onClick={handleDownloadRecap}>
                Télécharger mon récapitulatif (PDF)
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
