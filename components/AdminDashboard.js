"use client";

import { useMemo, useState } from "react";
import AdminNav from "@/components/AdminNav";

const leadStatusLabels = {
  NEW: "Nouveau",
  QUALIFIED: "Qualifié",
  CONVERTED: "Converti",
  ARCHIVED: "Archivé"
};

const leadTypeLabels = {
  GESTION_RH: "Gestion RH",
  GESTION_COMPTA: "Gestion comptable",
  CREATION: "Création",
  REPRISE: "Reprise",
  ANNONCE: "Annonce",
  CONTACT: "Contact"
};

const dossierStatusLabels = {
  NEW: "Nouveau",
  WAITING_VALIDATION: "En attente",
  IN_PROGRESS: "En cours",
  DOCUMENT_REQUESTED: "Doc. demandé",
  DOCUMENT_RECEIVED: "Doc. reçu",
  PAYMENT_REQUESTED: "Paiement demandé",
  PROCESSING: "Traitement",
  COMPLETED: "Finalisé",
  ARCHIVED: "Archivé",
  CANCELLED: "Annulé"
};

const paymentStatusLabels = {
  DRAFT: "Brouillon",
  REQUESTED: "Demandé",
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  CANCELLED: "Annulé"
};

const chartPalette = ["#6b5b4f", "#c9a96e", "#166534", "#b45309", "#1d4ed8", "#b00020", "#0f766e"];

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAmount(amountInCents, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format((amountInCents || 0) / 100);
}

function getLeadName(lead) {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  return fullName || lead.email || lead.phone || "Prospect non identifié";
}

function BarChart({ data, height = 180 }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="chart-bars" style={{ height }}>
      {data.map((item, index) => (
        <div className="chart-bar-track" key={item.label} title={`${item.label}: ${item.value}`}>
          <div
            className="chart-bar-fill"
            style={{
              height: `${(item.value / max) * 100}%`,
              background: chartPalette[index % chartPalette.length]
            }}
          />
          <span className="chart-bar-value">{item.value}</span>
          <span className="chart-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, width = 460, height = 170 }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const padding = 12;
  const usableHeight = height - padding * 2;

  const points = data.map((item, index) => {
    const x = index * stepX;
    const y = padding + usableHeight - (item.value / max) * usableHeight;
    return { x, y, ...item };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg className="chart-line" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Évolution des prospects">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(201,169,110,0.35)" />
          <stop offset="100%" stopColor="rgba(201,169,110,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lineFill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#6b5b4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} r="3" fill="#6b5b4f" />
      ))}
    </svg>
  );
}

function DonutChart({ data, size = 168, thickness = 26 }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="chart-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Répartition par statut">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ece7e1" strokeWidth={thickness} />
          {total > 0 &&
            data.map((item, index) => {
              const fraction = item.value / total;
              const dash = fraction * circumference;
              const circle = (
                <circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={chartPalette[index % chartPalette.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
        </g>
        <text x="50%" y="48%" textAnchor="middle" className="chart-donut-total">{total}</text>
        <text x="50%" y="62%" textAnchor="middle" className="chart-donut-caption">total</text>
      </svg>
      <ul className="chart-legend">
        {data.map((item, index) => (
          <li key={item.label}>
            <span className="chart-legend-dot" style={{ background: chartPalette[index % chartPalette.length] }} />
            {item.label}
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminDashboard({ metrics }) {
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");

  const leadTrendData = useMemo(
    () => metrics.leadTrend.map((point) => ({ label: point.label, value: point.value })),
    [metrics.leadTrend]
  );

  const leadStatusData = useMemo(
    () =>
      Object.entries(metrics.leadsByStatus).map(([status, value]) => ({
        label: leadStatusLabels[status] || status,
        value
      })),
    [metrics.leadsByStatus]
  );

  const dossierStatusData = useMemo(
    () =>
      Object.entries(metrics.dossiersByStatus)
        .filter(([, value]) => value > 0)
        .map(([status, value]) => ({
          label: dossierStatusLabels[status] || status,
          value
        })),
    [metrics.dossiersByStatus]
  );

  const leadTypeData = useMemo(
    () =>
      Object.entries(metrics.leadsByType)
        .filter(([, value]) => value > 0)
        .map(([type, value]) => ({
          label: leadTypeLabels[type] || type,
          value
        })),
    [metrics.leadsByType]
  );

  const filteredRecentLeads = useMemo(() => {
    if (leadStatusFilter === "ALL") {
      return metrics.recentLeads;
    }

    return metrics.recentLeads.filter((lead) => lead.status === leadStatusFilter);
  }, [metrics.recentLeads, leadStatusFilter]);

  return (
    <main className="dashboard-shell">
      <div className="container">
        <AdminNav />

        <section className="kpi-grid">
          <article className="kpi-card">
            <div className="kpi-head">
              <span className="tag">Total prospects</span>
              <span className="kpi-trend">+{metrics.kpis.leadsLast7Days} / 7j</span>
            </div>
            <strong>{metrics.kpis.totalLeads}</strong>
            <p>{metrics.kpis.newLeads} nouveau(x) à traiter</p>
          </article>
          <article className="kpi-card">
            <div className="kpi-head">
              <span className="tag">Taux de conversion</span>
            </div>
            <strong>{metrics.kpis.conversionRate}%</strong>
            <p>{metrics.kpis.convertedLeads} prospect(s) converti(s)</p>
          </article>
          <article className="kpi-card">
            <div className="kpi-head">
              <span className="tag">Dossiers actifs</span>
            </div>
            <strong>{metrics.kpis.activeDossiers}</strong>
            <p>{metrics.kpis.totalDossiers} dossier(s) au total</p>
          </article>
          <article className="kpi-card">
            <div className="kpi-head">
              <span className="tag">Documents à vérifier</span>
            </div>
            <strong>{metrics.kpis.pendingDocuments}</strong>
            <p>En attente de validation</p>
          </article>
          <article className="kpi-card">
            <div className="kpi-head">
              <span className="tag">Revenus encaissés</span>
              <span className="kpi-trend">{formatAmount(metrics.kpis.revenueLast30Days)} / 30j</span>
            </div>
            <strong>{formatAmount(metrics.kpis.totalRevenue)}</strong>
            <p>{metrics.kpis.pendingPayments} paiement(s) en attente</p>
          </article>
          <article className="kpi-card">
            <div className="kpi-head">
              <span className="tag">Managers</span>
            </div>
            <strong>{metrics.kpis.managerCount}</strong>
            <p>{metrics.kpis.unassignedDossiers} dossier(s) non affecté(s)</p>
          </article>
        </section>

        <section className="charts-grid">
          <article className="dashboard-card chart-card chart-card-wide">
            <div className="dashboard-head">
              <div>
                <h3>Prospects reçus (14 derniers jours)</h3>
                <p>Volume quotidien de demandes entrantes.</p>
              </div>
            </div>
            <LineChart data={leadTrendData} />
          </article>

          <article className="dashboard-card chart-card">
            <div className="dashboard-head">
              <div>
                <h3>Prospects par statut</h3>
                <p>Pipeline commercial.</p>
              </div>
            </div>
            <DonutChart data={leadStatusData} />
          </article>

          <article className="dashboard-card chart-card">
            <div className="dashboard-head">
              <div>
                <h3>Dossiers par statut</h3>
                <p>Charge de production en cours.</p>
              </div>
            </div>
            {dossierStatusData.length > 0 ? (
              <BarChart data={dossierStatusData} />
            ) : (
              <div className="notice">Aucun dossier à afficher.</div>
            )}
          </article>

          <article className="dashboard-card chart-card">
            <div className="dashboard-head">
              <div>
                <h3>Prospects par service</h3>
                <p>Origine des demandes.</p>
              </div>
            </div>
            {leadTypeData.length > 0 ? (
              <BarChart data={leadTypeData} />
            ) : (
              <div className="notice">Aucune donnée disponible.</div>
            )}
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card">
            <div className="dashboard-head">
              <div>
                <h3>Derniers prospects</h3>
                <p>{filteredRecentLeads.length} prospect(s) affiché(s).</p>
              </div>
              <div className="inline-actions">
                <select value={leadStatusFilter} onChange={(event) => setLeadStatusFilter(event.target.value)}>
                  <option value="ALL">Tous les statuts</option>
                  {Object.entries(leadStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <a className="btn btn-outline" href="/admin/prospects">Tout voir</a>
              </div>
            </div>
            <div className="data-table">
              <div className="data-table-head">
                <span>Prospect</span>
                <span>Service</span>
                <span>Statut</span>
                <span>Reçu le</span>
              </div>
              {filteredRecentLeads.map((lead) => (
                <div className="data-table-row" key={lead.id}>
                  <span data-label="Prospect">
                    <strong>{getLeadName(lead)}</strong>
                    <small>{lead.email || lead.phone || "—"}</small>
                  </span>
                  <span data-label="Service">{leadTypeLabels[lead.type] || lead.type}</span>
                  <span data-label="Statut">
                    <span className={`badge badge-${lead.status.toLowerCase()}`}>{leadStatusLabels[lead.status] || lead.status}</span>
                  </span>
                  <span data-label="Reçu le">{formatDate(lead.createdAt)}</span>
                </div>
              ))}
              {filteredRecentLeads.length === 0 && <div className="notice">Aucun prospect pour ce filtre.</div>}
            </div>
          </article>

          <aside className="dashboard-side">
            <article className="dashboard-card">
              <div className="dashboard-head">
                <div>
                  <h3>Derniers paiements</h3>
                  <p>Suivi de la facturation.</p>
                </div>
                <a className="btn btn-outline" href="/admin/paiements">Voir</a>
              </div>
              <div className="data-table">
                {metrics.recentPayments.map((payment) => (
                  <div className="data-table-row payment-row" key={payment.id}>
                    <span data-label="Libellé">
                      <strong>{payment.label}</strong>
                      <small>{payment.clientName}</small>
                    </span>
                    <span data-label="Montant"><strong>{formatAmount(payment.amount, payment.currency)}</strong></span>
                    <span data-label="Statut">
                      <span className={`badge badge-pay-${payment.status.toLowerCase()}`}>{paymentStatusLabels[payment.status] || payment.status}</span>
                    </span>
                  </div>
                ))}
                {metrics.recentPayments.length === 0 && <div className="notice">Aucun paiement enregistré.</div>}
              </div>
            </article>

            <article className="dashboard-card">
              <div className="dashboard-head">
                <div>
                  <h3>Notifications récentes</h3>
                  <p>Activité back-office.</p>
                </div>
              </div>
              <div className="timeline-feed">
                {metrics.recentNotifications.map((notification) => (
                  <div className="timeline-item" key={notification.id}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <small>{formatDateTime(notification.createdAt)}</small>
                    </div>
                  </div>
                ))}
                {metrics.recentNotifications.length === 0 && <div className="notice">Aucune notification.</div>}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
