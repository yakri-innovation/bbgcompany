"use client";

import { useMemo, useState } from "react";

const dossierStatusLabels = {
  NEW: "Nouveau",
  WAITING_VALIDATION: "En attente",
  IN_PROGRESS: "En cours",
  DOCUMENT_REQUESTED: "Document demandé",
  DOCUMENT_RECEIVED: "Document reçu",
  PAYMENT_REQUESTED: "Paiement demandé",
  PROCESSING: "Traitement",
  COMPLETED: "Finalisé",
  ARCHIVED: "Archivé",
  CANCELLED: "Annulé"
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

function getClientLabel(dossier) {
  const fullName = [dossier.client.firstName, dossier.client.lastName].filter(Boolean).join(" ");
  return `${fullName || "Client"} · ${dossier.client.user.email}`;
}

function getAdvisorLabel(dossier) {
  if (!dossier.advisor) {
    return "Non affecté";
  }

  if (dossier.advisor.role === "MANAGER") {
    return `Manager: ${dossier.advisor.email}`;
  }

  return `${dossier.advisor.role}: ${dossier.advisor.email}`;
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


export default function AdminAssignmentsPage({ initialManagers, initialDossiers }) {
  const [managers] = useState(initialManagers);
  const [dossiers, setDossiers] = useState(initialDossiers);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [managerFilter, setManagerFilter] = useState("UNASSIGNED");
  const [selectedDossierIds, setSelectedDossierIds] = useState([]);
  const [bulkManagerId, setBulkManagerId] = useState("");
  const [pendingAction, setPendingAction] = useState(false);
  const [message, setMessage] = useState("");

  const filteredDossiers = useMemo(() => {
    return dossiers.filter((dossier) => {
      const matchesStatus = statusFilter === "ALL" || dossier.status === statusFilter;

      let matchesManager = true;

      if (managerFilter === "UNASSIGNED") {
        matchesManager = dossier.advisor?.role !== "MANAGER";
      } else if (managerFilter !== "ALL") {
        matchesManager = dossier.advisor?.id === managerFilter;
      }

      return matchesStatus && matchesManager;
    });
  }, [dossiers, statusFilter, managerFilter]);

  const kpis = useMemo(() => {
    const unassigned = dossiers.filter((dossier) => dossier.advisor?.role !== "MANAGER").length;
    const assigned = dossiers.filter((dossier) => dossier.advisor?.role === "MANAGER").length;
    const inProgress = dossiers.filter((dossier) => ["IN_PROGRESS", "DOCUMENT_REQUESTED", "DOCUMENT_RECEIVED", "PAYMENT_REQUESTED", "PROCESSING"].includes(dossier.status)).length;

    return [
      {
        label: "Total dossiers",
        value: dossiers.length,
        hint: "Tous statuts"
      },
      {
        label: "Non affectés",
        value: unassigned,
        hint: "Sans manager"
      },
      {
        label: "Affectés",
        value: assigned,
        hint: "Avec manager"
      },
      {
        label: "En traitement",
        value: inProgress,
        hint: "Dossiers actifs"
      }
    ];
  }, [dossiers]);

  const applyDossierUpdate = (updatedDossier) => {
    setDossiers((current) => current.map((dossier) => (dossier.id === updatedDossier.id ? updatedDossier : dossier)));
  };

  const selectedVisibleCount = useMemo(
    () => filteredDossiers.filter((dossier) => selectedDossierIds.includes(dossier.id)).length,
    [filteredDossiers, selectedDossierIds]
  );

  const allVisibleSelected = filteredDossiers.length > 0 && selectedVisibleCount === filteredDossiers.length;

  const toggleRow = (dossierId) => {
    setSelectedDossierIds((current) => {
      if (current.includes(dossierId)) {
        return current.filter((id) => id !== dossierId);
      }

      return [...current, dossierId];
    });
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredDossiers.map((dossier) => dossier.id));
      setSelectedDossierIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }

    const mergedIds = new Set(selectedDossierIds);
    filteredDossiers.forEach((dossier) => mergedIds.add(dossier.id));
    setSelectedDossierIds(Array.from(mergedIds));
  };

  const handleBulkAssign = async () => {
    const managerId = bulkManagerId.trim();
    const targetIds = filteredDossiers
      .map((dossier) => dossier.id)
      .filter((id) => selectedDossierIds.includes(id));

    if (!managerId) {
      setMessage("Sélectionnez un manager pour l'affectation multiple.");
      return;
    }

    if (targetIds.length === 0) {
      setMessage("Sélectionnez au moins un dossier.");
      return;
    }

    setPendingAction(true);
    setMessage("");

    let successCount = 0;
    let failedCount = 0;

    for (const dossierId of targetIds) {
      try {
        const response = await fetch(`/api/admin/dossiers/${dossierId}/assign-manager`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ managerId })
        });

        const data = await response.json();

        if (!response.ok) {
          failedCount += 1;
          continue;
        }

        if (data.dossier) {
          applyDossierUpdate(data.dossier);
        }

        successCount += 1;
      } catch (error) {
        failedCount += 1;
      }
    }

    setPendingAction(false);
    setSelectedDossierIds((current) => current.filter((id) => !targetIds.includes(id)));

    const manager = managers.find((item) => item.id === managerId);

    if (failedCount > 0) {
      setMessage(`${successCount} dossier(s) affecté(s) à ${manager?.email || "manager"}, ${failedCount} échec(s).`);
      return;
    }

    setMessage(`${successCount} dossier(s) affecté(s) à ${manager?.email || "manager"}.`);
  };

  const handleExportCsv = () => {
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const lines = [];

    lines.push("Rapport;Affectations dossiers");
    lines.push(`Genere le;${new Date().toLocaleString("fr-FR")}`);
    lines.push(`Filtre manager;${managerFilter}`);
    lines.push(`Filtre statut;${statusFilter}`);
    lines.push("");
    lines.push("Dossier;Client;Statut;Manager actuel;Derniere mise a jour");

    filteredDossiers.forEach((dossier) => {
      lines.push([
        escapeCsvCell(dossier.title),
        escapeCsvCell(getClientLabel(dossier)),
        escapeCsvCell(dossierStatusLabels[dossier.status] || dossier.status),
        escapeCsvCell(getAdvisorLabel(dossier)),
        escapeCsvCell(formatDate(dossier.updatedAt))
      ].join(";"));
    });

    const csvContent = `\uFEFF${lines.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-affectations-filtre-${dateStamp}.csv`;
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

    addText("BBG COMPANY - Affectations dossiers", 40, 14, "F2");
    y -= 22;
    addText(`Genere le ${new Date().toLocaleString("fr-FR")}`, 40, 9, "F1");
    y -= 14;
    addText(`Filtre manager: ${managerFilter}`, 40, 9, "F1");
    y -= 12;
    addText(`Filtre statut: ${statusFilter}`, 40, 9, "F1");
    y -= 18;

    filteredDossiers.forEach((dossier, index) => {
      if (y < 70) {
        return;
      }

      addWrapped(`${index + 1}. ${dossier.title}`);
      addWrapped(`Client: ${getClientLabel(dossier)}`, 52, 9);
      addWrapped(`Statut: ${dossierStatusLabels[dossier.status] || dossier.status} | Manager: ${getAdvisorLabel(dossier)}`, 52, 9);
      addWrapped(`Maj: ${formatDate(dossier.updatedAt)}`, 52, 9);
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
    link.download = `bbg-affectations-filtre-${dateStamp}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="assignments-simple-shell">
          <header className="assignments-simple-header">
            <div>
              <h1>Affectations dossiers</h1>
              <p>{filteredDossiers.length} dossier(s) affiché(s) · {selectedVisibleCount} sélectionné(s)</p>
            </div>
            <a className="btn btn-secondary" href="/admin">Retour au tableau de bord</a>
          </header>

          <div className="assignments-simple-toolbar">
            <div className="inline-actions">
              <select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)}>
                <option value="ALL">Tous les managers</option>
                <option value="UNASSIGNED">Non affectés</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.email}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tous les statuts</option>
                {Object.entries(dossierStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="inline-actions">
              <select value={bulkManagerId} onChange={(event) => setBulkManagerId(event.target.value)}>
                <option value="">Manager cible</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.email}</option>
                ))}
              </select>
              <button className="btn btn-primary" type="button" onClick={handleBulkAssign} disabled={pendingAction || managers.length === 0}>
                {pendingAction ? "Affectation..." : "Affecter la sélection"}
              </button>
              <button className="btn btn-outline" type="button" onClick={handleExportCsv} disabled={filteredDossiers.length === 0}>
                Export CSV
              </button>
              <button className="btn btn-outline" type="button" onClick={handleExportPdf} disabled={filteredDossiers.length === 0}>
                Export PDF
              </button>
            </div>
          </div>

          <div className="metrics-grid assignments-kpis" style={{ marginBottom: 14 }}>
            {kpis.map((kpi) => (
              <article className="metric-card" key={kpi.label}>
                <span className="tag">{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <p>{kpi.hint}</p>
              </article>
            ))}
          </div>

          {message && <div className="notice" style={{ marginBottom: 14 }}>{message}</div>}

          <div className="assignments-table-wrap">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      aria-label="Sélectionner tous les dossiers affichés"
                    />
                  </th>
                  <th>Dossier</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Manager actuel</th>
                  <th>Maj</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.map((dossier) => (
                  <tr key={dossier.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDossierIds.includes(dossier.id)}
                        onChange={() => toggleRow(dossier.id)}
                        aria-label={`Sélectionner ${dossier.title}`}
                      />
                    </td>
                    <td>
                      <strong>{dossier.title}</strong>
                    </td>
                    <td>{getClientLabel(dossier)}</td>
                    <td>
                      <span className="status-pill">{dossierStatusLabels[dossier.status] || dossier.status}</span>
                    </td>
                    <td>{getAdvisorLabel(dossier)}</td>
                    <td>{formatDate(dossier.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDossiers.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucun dossier ne correspond aux filtres sélectionnés.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
