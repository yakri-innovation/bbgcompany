"use client";

import { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    subject: "Gestion",
    contactPreference: "Mail",
    message: ""
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeadSubmitted, setIsLeadSubmitted] = useState(false);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState(null);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setIsLeadSubmitted(false);
    setIsSubmitting(true);

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "CONTACT",
        source: "contact-section",
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        payload: formData
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus("Impossible d'enregistrer votre demande pour le moment.");
      return;
    }

    setLastSubmittedPayload(formData);
    setIsLeadSubmitted(true);
    setStatus("Votre demande a bien été enregistrée. Un conseiller BBG Company vous recontactera rapidement.");
    setFormData({
      lastName: "",
      firstName: "",
      email: "",
      phone: "",
      subject: "Gestion",
      contactPreference: "Mail",
      message: ""
    });
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
    addText("Recapitulatif - Prise de contact", 185, 10, "F1");
    y = 798;
    addText(`Reference dossier: ${referenceId}`, 395, 10, "F1");

    setFillColor("0.1216", "0.1216", "0.1216");

    y = 735;
    addText(`Genere le ${new Date().toLocaleString("fr-FR")}`, 40, 9, "F1");
    moveDown(22);
    addDivider();

    addSectionTitle("1. Coordonnees client");
    addField("Nom", payload.lastName);
    addField("Prenom", payload.firstName);
    addField("Email", payload.email);
    addField("Telephone", payload.phone);
    addDivider();

    addSectionTitle("2. Demande");
    addField("Sujet", payload.subject);
    addField("Preference de contact", payload.contactPreference);
    addField("Message", payload.message);
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
    if (!lastSubmittedPayload) {
      return;
    }

    const pdfContent = buildProfessionalPdf(lastSubmittedPayload);
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-recap-contact-${dateStamp}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="section" id="contact">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>Contactez-nous</h2>
        <div className="contact-grid">
          <article className="contact-card">
            <h3>Coordonnées directes</h3>
            <ul className="list-clean">
              <li>RH : RH@bbg-company.fr</li>
              <li>Comptabilité : compta@bbg-company.fr</li>
              <li>Annonces : annonces@bbg-company.fr</li>
              <li>Téléphone : 01.02.03.04.05</li>
            </ul>
          </article>
          <form className="form-card" onSubmit={handleSubmit}>
            <h3>Formulaire de contact</h3>
            <div className="form-grid">
              <div className="field">
                <label>Nom</label>
                <input type="text" placeholder="Votre nom" value={formData.lastName} onChange={(event) => updateField("lastName", event.target.value)} required />
              </div>
              <div className="field">
                <label>Prénom</label>
                <input type="text" placeholder="Votre prénom" value={formData.firstName} onChange={(event) => updateField("firstName", event.target.value)} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="vous@entreprise.fr" value={formData.email} onChange={(event) => updateField("email", event.target.value)} required />
              </div>
              <div className="field">
                <label>Téléphone</label>
                <input type="tel" placeholder="06 00 00 00 00" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} />
              </div>
              <div className="field">
                <label>Sujet</label>
                <select value={formData.subject} onChange={(event) => updateField("subject", event.target.value)}>
                  <option value="Gestion">Gestion</option>
                  <option value="Création">Création</option>
                  <option value="Fusion / Acquisition">Fusion / Acquisition</option>
                </select>
              </div>
              <div className="field">
                <label>Préférence de contact</label>
                <select value={formData.contactPreference} onChange={(event) => updateField("contactPreference", event.target.value)}>
                  <option value="Mail">Mail</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Message</label>
                <textarea placeholder="Décrivez votre besoin" value={formData.message} onChange={(event) => updateField("message", event.target.value)} required />
              </div>
            </div>
            {status && <div className="subsection notice">{status}</div>}
            <div className="subsection inline-actions">
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
              </button>
              {isLeadSubmitted && (
                <button className="btn btn-outline" type="button" onClick={handleDownloadRecap}>
                  Télécharger mon récapitulatif (PDF)
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
