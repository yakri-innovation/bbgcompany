"use client";

import { useMemo, useState } from "react";
import { announcementCategoryLabels, announcementStatusLabels, priceBandLabels } from "@/lib/announcements";

const initialForm = {
  title: "",
  category: "COMMERCIAL_COMPANY",
  city: "",
  price: "",
  priceBand: "moins-5000",
  description: "",
  highlights: "",
  status: "DRAFT"
};

function formatDate(value) {
  if (!value) {
    return "Non publié";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getPriceLabel(announcement) {
  if (!announcement.price) {
    return "Prix non renseigné";
  }

  if (!announcement.priceBand) {
    return announcement.price;
  }

  return `${announcement.price} · ${priceBandLabels[announcement.priceBand]}`;
}

function buildDetails(highlights) {
  return {
    highlights: highlights
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

export default function AdminAnnouncementsPage({ initialAnnouncements }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [form, setForm] = useState(initialForm);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesStatus = statusFilter === "ALL" || announcement.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || announcement.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [announcements, statusFilter, categoryFilter]);

  const kpis = useMemo(() => {
    const drafts = announcements.filter((announcement) => announcement.status === "DRAFT").length;
    const published = announcements.filter((announcement) => announcement.status === "PUBLISHED").length;
    const archived = announcements.filter((announcement) => announcement.status === "ARCHIVED").length;

    return [
      {
        label: "Total annonces",
        value: announcements.length,
        hint: "Tous statuts"
      },
      {
        label: "Brouillons",
        value: drafts,
        hint: "À finaliser"
      },
      {
        label: "Publiées",
        value: published,
        hint: "Visibles en front"
      },
      {
        label: "Archivées",
        value: archived,
        hint: "Historique"
      }
    ];
  }, [announcements]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const replaceAnnouncement = (updatedAnnouncement) => {
    setAnnouncements((current) => current.map((announcement) => (announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement)));
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    setMessage("");
    setPendingAction("create");

    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        city: form.city,
        price: form.price,
        priceBand: form.category === "COMMERCIAL_COMPANY" ? form.priceBand : null,
        description: form.description,
        details: buildDetails(form.highlights),
        status: form.status
      })
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de créer l'annonce.");
      return;
    }

    setAnnouncements((current) => [data.announcement, ...current]);
    setForm(initialForm);
    setShowCreateForm(false);
    setMessage("Annonce créée avec succès.");
  };

  const handleStatusChange = async (announcementId, status) => {
    setMessage("");
    setPendingAction(`${announcementId}-${status}`);

    const response = await fetch(`/api/admin/announcements/${announcementId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    setPendingAction("");

    if (!response.ok) {
      setMessage(data.error || "Impossible de modifier l'annonce.");
      return;
    }

    replaceAnnouncement(data.announcement);
    setMessage("Statut de l'annonce mis à jour.");
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Annonces</h1>
              <p>{filteredAnnouncements.length} annonce(s) affichée(s) sur {announcements.length}</p>
            </div>
            <div className="inline-actions announcements-header-actions">
              <button className="btn btn-outline" type="button" onClick={() => setShowCreateForm(true)}>
                Nouvelle annonce
              </button>
              <a className="btn btn-secondary" href="/admin">Retour au tableau de bord</a>
            </div>
          </header>

          <div className="leads-simple-toolbar">
            <div className="inline-actions">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tous les statuts</option>
                {Object.entries(announcementStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="ALL">Toutes les catégories</option>
                {Object.entries(announcementCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="metrics-grid announcements-kpis" style={{ marginBottom: 14 }}>
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
                  <th>Titre</th>
                  <th>Prix</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  <th>Publication</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>
                      <strong>{announcement.title}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{announcement.slug}</div>
                      {announcement.city && <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{announcement.city}</div>}
                    </td>
                    <td>{getPriceLabel(announcement)}</td>
                    <td>
                      <span className="tag">{announcementCategoryLabels[announcement.category]}</span>
                    </td>
                    <td>
                      <span className="status-pill">{announcementStatusLabels[announcement.status]}</span>
                    </td>
                    <td>{formatDate(announcement.publishedAt)}</td>
                    <td>
                      <div className="inline-actions leads-actions-cell">
                        {announcement.status !== "PUBLISHED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(announcement.id, "PUBLISHED")}
                            disabled={pendingAction === `${announcement.id}-PUBLISHED`}
                            title="Publier"
                            aria-label="Publier"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M5 12l4 4L19 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {announcement.status !== "DRAFT" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(announcement.id, "DRAFT")}
                            disabled={pendingAction === `${announcement.id}-DRAFT`}
                            title="Passer en brouillon"
                            aria-label="Passer en brouillon"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M4 20h16M7 16l8-8 3 3-8 8H7v-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {announcement.status !== "ARCHIVED" && (
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleStatusChange(announcement.id, "ARCHIVED")}
                            disabled={pendingAction === `${announcement.id}-ARCHIVED`}
                            title="Archiver"
                            aria-label="Archiver"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M4 8h16M6 8l1 11h10l1-11M9 8V5h6v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAnnouncements.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucune annonce ne correspond aux filtres sélectionnés.</div>
            )}
          </div>

          {showCreateForm && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(17, 24, 39, 0.45)",
                display: "grid",
                placeItems: "center",
                zIndex: 1200,
                padding: 16
              }}
            >
              <form
                className="panel"
                style={{ width: "min(760px, 100%)", maxHeight: "85vh", overflow: "auto", margin: 0 }}
                onSubmit={handleCreateAnnouncement}
              >
                <h3 style={{ marginBottom: 12 }}>Nouvelle annonce</h3>

                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Titre</label>
                  <input type="text" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Ex : Restaurant de quartier" />
                </div>

                <div className="inline-actions" style={{ marginBottom: 10, flexWrap: "wrap" }}>
                  <div className="field" style={{ minWidth: 220 }}>
                    <label>Catégorie</label>
                    <select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
                      {Object.entries(announcementCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field" style={{ minWidth: 180 }}>
                    <label>Statut</label>
                    <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                      {Object.entries(announcementStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field" style={{ minWidth: 160 }}>
                    <label>Prix (optionnel)</label>
                    <input type="text" value={form.price} onChange={(event) => updateForm("price", event.target.value)} placeholder="Sur demande" />
                  </div>

                  <div className="field" style={{ minWidth: 160 }}>
                    <label>Ville (optionnel)</label>
                    <input type="text" value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="Paris" />
                  </div>

                  {form.category === "COMMERCIAL_COMPANY" && (
                    <div className="field" style={{ minWidth: 180 }}>
                      <label>Niveau prix</label>
                      <select value={form.priceBand} onChange={(event) => updateForm("priceBand", event.target.value)}>
                        {Object.entries(priceBandLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Description</label>
                  <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Description visible dans la fiche annonce" />
                </div>

                <details style={{ marginBottom: 12 }}>
                  <summary style={{ cursor: "pointer", color: "var(--muted)", fontWeight: 600 }}>Options avancées</summary>
                  <div className="field" style={{ marginTop: 10 }}>
                    <label>Détails complémentaires</label>
                    <textarea value={form.highlights} onChange={(event) => updateForm("highlights", event.target.value)} placeholder="Une ligne par information importante" />
                  </div>
                </details>

                <div className="inline-actions">
                  <button className="btn btn-primary" type="submit" disabled={pendingAction === "create"}>
                    {pendingAction === "create" ? "Création..." : "Créer l'annonce"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
