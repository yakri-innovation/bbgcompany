"use client";

import { useMemo, useState } from "react";

const entityLabels = {
  USER: "Compte",
  Lead: "Prospect",
  Dossier: "Dossier",
  Document: "Document",
  Payment: "Paiement",
  Announcement: "Annonce"
};

const actionLabels = {
  STAFF_ACCOUNT_CREATED: "Compte équipe créé",
  STAFF_ACCOUNT_UPDATED: "Compte équipe modifié",
  CLIENT_ACCOUNT_CREATED: "Compte client créé",
  CLIENT_ACCOUNT_UPDATED: "Compte client modifié",
  CONVERT_TO_DOSSIER: "Prospect converti en dossier",
  UPDATE_STATUS: "Statut prospect mis à jour",
  ASSIGN_MANAGER: "Manager affecté",
  ADMIN_REQUEST: "Document demandé",
  ADMIN_REVIEW: "Document vérifié (admin)",
  MANAGER_REVIEW: "Document vérifié (manager)",
  CLIENT_UPLOAD_CREATE: "Document déposé",
  CLIENT_UPLOAD_UPDATE: "Document mis à jour",
  MANAGER_VALIDATE: "Dossier validé (manager)",
  MANAGER_MESSAGE: "Message manager",
  CREATE_REQUEST: "Demande de paiement créée",
  CHECKOUT_SESSION_CREATED: "Session de paiement créée",
  WEBHOOK_PAID: "Paiement confirmé",
  WEBHOOK_EXPIRED: "Paiement expiré",
  CREATE: "Création",
  UPDATE: "Mise à jour"
};

function formatDateTime(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getActionLabel(action) {
  return actionLabels[action] || action;
}

function getEntityLabel(entityType) {
  return entityLabels[entityType] || entityType;
}

export default function AdminAuditPage({ initialLogs }) {
  const [logs] = useState(initialLogs);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(25);

  const entityOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.entityType)));
  }, [logs]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action)));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesEntity = entityFilter === "ALL" || log.entityType === entityFilter;
      const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
      const haystack = `${log.actorEmail} ${log.entityType} ${log.action} ${log.entityId} ${log.metadataSummary}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      return matchesEntity && matchesAction && matchesSearch;
    });
  }, [logs, entityFilter, actionFilter, search]);

  const visibleLogs = filteredLogs.slice(0, visibleCount);

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return {
      total: logs.length,
      last24h: logs.filter((log) => now - new Date(log.createdAt).getTime() <= dayMs).length,
      actors: new Set(logs.map((log) => log.actorEmail)).size,
      entities: entityOptions.length
    };
  }, [logs, entityOptions]);

  const kpis = useMemo(() => {
    return [
      {
        label: "Total événements",
        value: stats.total,
        hint: "Entrées journalisées"
      },
      {
        label: "Événements 24h",
        value: stats.last24h,
        hint: "Activité récente"
      },
      {
        label: "Acteurs",
        value: stats.actors,
        hint: "Utilisateurs distincts"
      },
      {
        label: "Entités",
        value: stats.entities,
        hint: "Domaines tracés"
      }
    ];
  }, [stats]);

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Audit</h1>
              <p>{filteredLogs.length} événement(s) affiché(s) sur {logs.length}</p>
            </div>
            <div className="inline-actions announcements-header-actions">
              <a className="btn btn-secondary" href="/admin">Retour au tableau de bord</a>
            </div>
          </header>

          <div className="leads-simple-toolbar">
            <div className="inline-actions">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(25);
                }}
                placeholder="Rechercher..."
              />
              <select
                value={entityFilter}
                onChange={(event) => {
                  setEntityFilter(event.target.value);
                  setVisibleCount(25);
                }}
              >
                <option value="ALL">Toutes les entités</option>
                {entityOptions.map((entity) => (
                  <option key={entity} value={entity}>{getEntityLabel(entity)}</option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(event) => {
                  setActionFilter(event.target.value);
                  setVisibleCount(25);
                }}
              >
                <option value="ALL">Toutes les actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{getActionLabel(action)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="metrics-grid audit-kpis" style={{ marginBottom: 14 }}>
            {kpis.map((kpi) => (
              <article className="metric-card" key={kpi.label}>
                <span className="tag">{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <p>{kpi.hint}</p>
              </article>
            ))}
          </div>

          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Acteur</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {visibleLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <strong>{log.actorEmail}</strong>
                      {log.actorRole ? <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{log.actorRole}</div> : null}
                    </td>
                    <td>
                      <span className="tag">{getActionLabel(log.action)}</span>
                    </td>
                    <td>
                      <div>{getEntityLabel(log.entityType)}</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{log.entityId}</div>
                    </td>
                    <td>{log.metadataSummary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLogs.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucun événement pour ces critères.</div>
            )}
          </div>

          {visibleCount < filteredLogs.length && (
            <div className="inline-actions" style={{ marginTop: 16, justifyContent: "center" }}>
              <button className="btn btn-outline" type="button" onClick={() => setVisibleCount((count) => count + 25)}>
                Afficher plus ({filteredLogs.length - visibleCount} restant(s))
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
