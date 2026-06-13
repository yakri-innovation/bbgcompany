"use client";

import { useMemo, useState } from "react";

const statusLabels = {
  NEW: "Nouveau",
  QUALIFIED: "Qualifié",
  CONVERTED: "Converti",
  ARCHIVED: "Archivé"
};

const typeLabels = {
  GESTION_RH: "Gestion RH",
  GESTION_COMPTA: "Gestion comptable",
  CREATION: "Création",
  REPRISE: "Reprise",
  ANNONCE: "Annonce",
  CONTACT: "Contact"
};

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getLeadName(lead) {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  return fullName || lead.email || lead.phone || "Prospect non identifié";
}

function getLeadContact(lead) {
  return [lead.email, lead.phone].filter(Boolean).join(" · ") || "Contact non renseigné";
}

function toAsciiText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .trim();
}

function escapePdfText(value) {
  return toAsciiText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfLine(text, maxChars = 92) {
  if (text.length <= maxChars) {
    return [text];
  }

  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length > maxChars) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function escapeCsvCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();

  if (/[",;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export default function AdminLeadsPage({ initialLeads }) {
  const [leads, setLeads] = useState(initialLeads);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      const matchesType = typeFilter === "ALL" || lead.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [leads, statusFilter, typeFilter]);

  const kpis = useMemo(() => {
    const newLeads = leads.filter((lead) => lead.status === "NEW").length;
    const qualifiedLeads = leads.filter((lead) => lead.status === "QUALIFIED").length;
    const convertedLeads = leads.filter((lead) => lead.status === "CONVERTED").length;

    return [
      {
        label: "Total prospects",
        value: leads.length,
        hint: "Tous statuts"
      },
      {
        label: "Nouveaux",
        value: newLeads,
        hint: "À traiter"
      },
      {
        label: "Qualifiés",
        value: qualifiedLeads,
        hint: "Prêts à convertir"
      },
      {
        label: "Convertis",
        value: convertedLeads,
        hint: "Dossiers créés"
      }
    ];
  }, [leads]);

  const updateLeadInState = (updatedLead) => {
    setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
  };

  const runLeadAction = async (leadId, body, successMessage) => {
    setMessage("");
    setPendingAction(`${leadId}-${body.action || body.status}`);

    const response = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Action impossible pour le moment.");
      return;
    }

    updateLeadInState(data.lead);
    setMessage(successMessage);
  };

  const handleStatusChange = (leadId, status) => {
    runLeadAction(leadId, { status }, "Statut de la demande mis à jour.");
  };

  const handleConvert = (leadId) => {
    runLeadAction(leadId, { action: "convert" }, "Demande convertie en dossier client.");
  };

  const handleExportCsv = () => {
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const lines = [];

    lines.push("Rapport;Prospects");
    lines.push(`Genere le;${new Date().toLocaleString("fr-FR")}`);
    lines.push(`Filtre statut;${statusFilter}`);
    lines.push(`Filtre type;${typeFilter}`);
    lines.push("");
    lines.push("Prospect;Contact;Type;Statut;Source;Date creation");

    filteredLeads.forEach((lead) => {
      lines.push([
        escapeCsvCell(getLeadName(lead)),
        escapeCsvCell(getLeadContact(lead)),
        escapeCsvCell(typeLabels[lead.type] || lead.type),
        escapeCsvCell(statusLabels[lead.status] || lead.status),
        escapeCsvCell(lead.source || "Source non renseignée"),
        escapeCsvCell(formatDate(lead.createdAt))
      ].join(";"));
    });

    const csvContent = `\uFEFF${lines.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-prospects-filtre-${dateStamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const content = [];
    let y = 760;

    const addText = (text, x = 40, size = 10, font = "F1") => {
      content.push("BT");
      content.push(`/${font} ${size} Tf`);
      content.push(`${x} ${y} Td`);
      content.push(`(${escapePdfText(text)}) Tj`);
      content.push("ET");
    };

    const addWrapped = (text, x = 40, size = 10) => {
      wrapPdfLine(toAsciiText(text)).forEach((line) => {
        addText(line, x, size, "F1");
        y -= 13;
      });
    };

    addText("BBG COMPANY - Prospects", 40, 14, "F2");
    y -= 22;
    addText(`Genere le ${new Date().toLocaleString("fr-FR")}`, 40, 9, "F1");
    y -= 14;
    addText(`Filtre statut: ${statusFilter}`, 40, 9, "F1");
    y -= 12;
    addText(`Filtre type: ${typeFilter}`, 40, 9, "F1");
    y -= 18;

    filteredLeads.forEach((lead, index) => {
      if (y < 70) {
        return;
      }

      addWrapped(`${index + 1}. ${getLeadName(lead)}`);
      addWrapped(`Contact: ${getLeadContact(lead)}`, 52, 9);
      addWrapped(`Type: ${typeLabels[lead.type] || lead.type} | Statut: ${statusLabels[lead.status] || lead.status}`, 52, 9);
      addWrapped(`Source: ${lead.source || "Source non renseignee"} | Cree le: ${formatDate(lead.createdAt)}`, 52, 9);
      y -= 6;
    });

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

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-prospects-filtre-${dateStamp}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Prospects</h1>
              <p>{filteredLeads.length} demande(s) affichée(s) sur {leads.length}</p>
            </div>
            <a className="btn btn-secondary" href="/admin">Retour au tableau de bord</a>
          </header>

          <div className="leads-simple-toolbar">
            <div className="inline-actions">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="ALL">Tous les types</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="inline-actions">
              <button className="btn btn-outline" type="button" onClick={handleExportCsv} disabled={filteredLeads.length === 0}>
                Export CSV
              </button>
              <button className="btn btn-outline" type="button" onClick={handleExportPdf} disabled={filteredLeads.length === 0}>
                Export PDF
              </button>
            </div>
          </div>

          <div className="metrics-grid leads-kpis" style={{ marginBottom: 14 }}>
            {kpis.map((kpi) => (
              <article className="metric-card" key={kpi.label}>
                <span className="tag">{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <p>{kpi.hint}</p>
              </article>
            ))}
          </div>

          {message && <div className="notice" style={{ marginBottom: 14 }}>{message}</div>}

          <div className="leads-table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Source</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{getLeadName(lead)}</strong>
                    </td>
                    <td>{getLeadContact(lead)}</td>
                    <td>
                      <span className="tag">{typeLabels[lead.type] || lead.type}</span>
                    </td>
                    <td>
                      <span className="status-pill">{statusLabels[lead.status] || lead.status}</span>
                    </td>
                    <td>{lead.source || "Source non renseignée"}</td>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>
                      <div className="inline-actions leads-actions-cell">
                        {lead.status === "CONVERTED" && lead.dossiers?.[0] && (
                          <a className="btn btn-outline" href={`/admin/affectations?dossierId=${lead.dossiers[0].id}`}>
                            Voir dossier
                          </a>
                        )}
                        {lead.status !== "QUALIFIED" && lead.status !== "CONVERTED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(lead.id, "QUALIFIED")}
                            disabled={pendingAction === `${lead.id}-QUALIFIED`}
                            title="Qualifier"
                            aria-label="Qualifier"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path
                                d="M20 6L9 17l-5-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                        {lead.status !== "CONVERTED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleConvert(lead.id)}
                            disabled={pendingAction === `${lead.id}-convert`}
                            title="Convertir"
                            aria-label="Convertir"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path
                                d="M21 7h-6m0 0l2.5-2.5M15 7l2.5 2.5M3 17h6m0 0l-2.5-2.5M9 17l-2.5 2.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                        {lead.status !== "ARCHIVED" && lead.status !== "CONVERTED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(lead.id, "ARCHIVED")}
                            disabled={pendingAction === `${lead.id}-ARCHIVED`}
                            title="Archiver"
                            aria-label="Archiver"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path
                                d="M4 8h16M6 8l1 11h10l1-11M9 8V5h6v3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucune demande ne correspond aux filtres sélectionnés.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
