const reassurances = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#F3EDE6" />
        <circle cx="20" cy="16" r="6" stroke="#5A483A" strokeWidth="2" fill="none" />
        <path d="M12 32c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#5A483A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="28" cy="12" r="3" fill="#C9A96E" />
      </svg>
    ),
    title: "Accompagnement personnalisé",
    description: "Un conseiller dédié suit votre dossier de A à Z, adapté à votre secteur d'activité."
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#F3EDE6" />
        <circle cx="20" cy="20" r="8" stroke="#5A483A" strokeWidth="2" fill="none" />
        <path d="M20 14v6l4 4" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Réponse rapide",
    description: "Moins d'une heure pour un premier retour qualifié sur votre demande."
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#F3EDE6" />
        <rect x="12" y="14" width="16" height="12" rx="2" stroke="#5A483A" strokeWidth="2" fill="none" />
        <path d="M16 18l4 4 8-8" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Expertise administrative et stratégique",
    description: "Des équipes spécialisées en RH, comptabilité, création et fusions-acquisitions."
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#F3EDE6" />
        <rect x="10" y="12" width="20" height="16" rx="2" stroke="#5A483A" strokeWidth="2" fill="none" />
        <path d="M14 20h12M14 24h8" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Suivi digitalisé du dossier",
    description: "Espace client sécurisé pour consulter, signer et suivre vos démarches en temps réel."
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#F3EDE6" />
        <circle cx="20" cy="18" r="6" stroke="#5A483A" strokeWidth="2" fill="none" />
        <path d="M12 34v-4c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v4" stroke="#5A483A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="28" cy="12" r="3" fill="#C9A96E" />
      </svg>
    ),
    title: "Interlocuteur dédié",
    description: "Un seul contact pour toutes vos questions, disponible par mail ou WhatsApp."
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#F3EDE6" />
        <path d="M14 18v-2a6 6 0 0 1 12 0v2" stroke="#5A483A" strokeWidth="2" strokeLinecap="round" />
        <rect x="12" y="18" width="16" height="12" rx="2" stroke="#5A483A" strokeWidth="2" fill="none" />
        <path d="M20 22v4" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="22" r="1.5" fill="#C9A96E" />
      </svg>
    ),
    title: "Confidentialité & sécurité",
    description: "Vos informations sont traitées de manière confidentielle et protégées à chaque étape de votre dossier."
  }
];

export default function ReassuranceSection() {
  return (
    <section className="section section-dark" id="reassurance">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Pourquoi choisir BBG Company
        </h2>
        <div className="reassurance-grid">
          {reassurances.map((item) => (
            <article className="reassurance-card" key={item.title}>
              <div className="reassurance-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
