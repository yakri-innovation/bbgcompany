"use client";

import { useMemo, useState } from "react";

const roleLabels = {
  MANAGER: "Manager",
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super admin"
};

const statusLabels = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  INVITED: "Invité"
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export default function AdminTeamPage({ initialUsers, currentUserId, currentUserRole }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ email: "", role: "MANAGER", password: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const stats = useMemo(() => {
    return {
      total: users.length,
      managers: users.filter((user) => user.role === "MANAGER").length,
      admins: users.filter((user) => user.role === "ADMIN" || user.role === "SUPER_ADMIN").length,
      suspended: users.filter((user) => user.status === "SUSPENDED").length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === "ALL") {
      return users;
    }

    return users.filter((user) => user.role === roleFilter);
  }, [users, roleFilter]);

  const resetFeedback = () => {
    setMessage("");
    setError("");
    setTempPassword("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    resetFeedback();
    setPendingId("create");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setPendingId("");

    if (!response.ok) {
      setError(data.error || "Création impossible.");
      return;
    }

    setUsers((current) => [data.user, ...current]);
    setForm({ email: "", role: "MANAGER", password: "" });
    setMessage(`Compte ${roleLabels[data.user.role]} créé pour ${data.user.email}.`);

    if (data.temporaryPassword) {
      setTempPassword(`${data.user.email} · mot de passe temporaire : ${data.temporaryPassword}`);
    }
  };

  const patchUser = async (id, payload, actionId) => {
    resetFeedback();
    setPendingId(actionId);

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setPendingId("");

    if (!response.ok) {
      setError(data.error || "Modification impossible.");
      return;
    }

    setUsers((current) => current.map((user) => (user.id === id ? data.user : user)));
    setMessage(`Compte ${data.user.email} mis à jour.`);

    if (data.temporaryPassword) {
      setTempPassword(`${data.user.email} · nouveau mot de passe temporaire : ${data.temporaryPassword}`);
    }
  };

  const canManage = (user) => {
    if (user.id === currentUserId) {
      return false;
    }

    if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && !isSuperAdmin) {
      return false;
    }

    return true;
  };

  const kpis = useMemo(() => {
    return [
      {
        label: "Total comptes équipe",
        value: stats.total,
        hint: "Managers + admins"
      },
      {
        label: "Managers",
        value: stats.managers,
        hint: "Suivi dossiers"
      },
      {
        label: "Administrateurs",
        value: stats.admins,
        hint: "Accès complet"
      },
      {
        label: "Suspendus",
        value: stats.suspended,
        hint: "Accès désactivé"
      }
    ];
  }, [stats]);

  const handleToggleStatus = (user) => {
    patchUser(user.id, { status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }, `${user.id}-status`);
  };

  const handleResetPassword = (user) => {
    patchUser(user.id, { resetPassword: true }, `${user.id}-reset`);
  };

  return (
    <main className="dashboard-shell">
      <div className="container" style={{ paddingTop: 28, paddingBottom: 32 }}>
        <section className="leads-simple-shell">
          <header className="leads-simple-header">
            <div>
              <h1>Équipe</h1>
              <p>{filteredUsers.length} compte(s) affiché(s) sur {users.length}</p>
            </div>
            <div className="inline-actions announcements-header-actions">
              <button className="btn btn-outline" type="button" onClick={() => setShowCreateModal(true)}>
                Nouveau
              </button>
              <a className="btn btn-secondary" href="/admin">Retour au tableau de bord</a>
            </div>
          </header>

          <div className="leads-simple-toolbar">
            <div className="inline-actions">
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="ALL">Tous les rôles</option>
                <option value="MANAGER">Managers</option>
                <option value="ADMIN">Administrateurs</option>
                <option value="SUPER_ADMIN">Super admins</option>
              </select>
            </div>
          </div>

          <div className="metrics-grid team-kpis" style={{ marginBottom: 14 }}>
            {kpis.map((kpi) => (
              <article className="metric-card" key={kpi.label}>
                <span className="tag">{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <p>{kpi.hint}</p>
              </article>
            ))}
          </div>

        {(message || error || tempPassword) && (
            <div className={`notice${error ? " notice-error" : ""}`} style={{ marginBottom: 14 }}>
            {error || message}
            {tempPassword && <div style={{ marginTop: 8, fontWeight: 700 }}>{tempPassword}</div>}
          </div>
        )}

          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Compte</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.email}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{user.assignedDossiers} dossier(s) affecté(s)</div>
                    </td>
                    <td>
                      {canManage(user) ? (
                        <select
                          value={user.role}
                          onChange={(event) => patchUser(user.id, { role: event.target.value }, `${user.id}-role`)}
                          disabled={pendingId === `${user.id}-role`}
                        >
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN" disabled={!isSuperAdmin}>Administrateur</option>
                          <option value="SUPER_ADMIN" disabled={!isSuperAdmin}>Super admin</option>
                        </select>
                      ) : (
                        <span className="tag">{roleLabels[user.role] || user.role}</span>
                      )}
                    </td>
                    <td>
                      <span className={user.status === "ACTIVE" ? "status-pill" : "tag"}>{statusLabels[user.status] || user.status}</span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {canManage(user) ? (
                        <div className="inline-actions leads-actions-cell">
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={pendingId === `${user.id}-status`}
                            title={user.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                            aria-label={user.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            className="icon-action-btn"
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            disabled={pendingId === `${user.id}-reset`}
                            title="Réinitialiser mot de passe"
                            aria-label="Réinitialiser mot de passe"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                              <path d="M3 12a9 9 0 0115.36-6.36M21 12a9 9 0 01-15.36 6.36M3 3v6h6M21 21v-6h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <small>{user.id === currentUserId ? "Votre compte" : "Réservé super admin"}</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="notice" style={{ marginTop: 12 }}>Aucun compte pour ce filtre.</div>
            )}
          </div>

          {showCreateModal && (
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
                onSubmit={handleCreate}
              >
                <h3 style={{ marginBottom: 12 }}>Nouveau compte équipe</h3>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>E-mail professionnel</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="prenom.nom@bbg-company.fr"
                  />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Rôle</label>
                  <select
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN" disabled={!isSuperAdmin}>Administrateur</option>
                    <option value="SUPER_ADMIN" disabled={!isSuperAdmin}>Super admin</option>
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Mot de passe (optionnel)</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Laisser vide pour générer"
                  />
                </div>
                {!isSuperAdmin && <div className="notice" style={{ marginBottom: 12 }}>Seul un super admin peut créer des comptes administrateurs.</div>}
                <div className="inline-actions">
                  <button className="btn btn-primary" type="submit" disabled={pendingId === "create"}>
                    {pendingId === "create" ? "Création..." : "Créer le compte"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowCreateModal(false)}>
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
