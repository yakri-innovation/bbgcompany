const platformCards = [
  {
    title: "Formulaires intelligents",
    label: "UX",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <rect x="10" y="12" width="24" height="6" rx="3" fill="#5A483A" opacity="0.15" />
        <rect x="10" y="22" width="24" height="6" rx="3" fill="#5A483A" opacity="0.1" />
        <rect x="10" y="32" width="16" height="4" rx="2" fill="#C9A96E" />
      </svg>
    )
  },
  {
    title: "Structure évolutive",
    label: "DATA",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <ellipse cx="22" cy="16" rx="10" ry="4" fill="#5A483A" opacity="0.12" />
        <ellipse cx="22" cy="22" rx="10" ry="4" fill="#5A483A" opacity="0.08" />
        <ellipse cx="22" cy="28" rx="10" ry="4" fill="#C9A96E" opacity="0.25" />
      </svg>
    )
  },
  {
    title: "Espace client",
    label: "CRM",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <rect x="10" y="12" width="24" height="20" rx="3" fill="#5A483A" opacity="0.08" />
        <circle cx="22" cy="20" r="4" fill="#C9A96E" opacity="0.3" />
        <rect x="16" y="28" width="12" height="2" rx="1" fill="#3D2E22" />
      </svg>
    )
  }
];

export default function PlatformSection() {
  return (
    <section className="section section-dark">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>La plateforme</h2>
        <div className="platform-editorial">
          <div className="platform-editorial-visual">
            <img
              src="https://images.pexels.com/photos/7869122/pexels-photo-7869122.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Équipe en réunion dans un cabinet professionnel mixte"
              className="platform-editorial-image"
            />
            <div className="platform-editorial-overlay" />
            <div className="platform-editorial-caption">Cabinet moderne, expertise humaine, accompagnement structuré.</div>
          </div>
        </div>
        <div className="cards-3">
          {platformCards.map((card) => (
            <article className="advantage-card advantage-card-visual" key={card.title}>
              <div className="platform-icon">{card.icon}</div>
              <span className="platform-label">{card.label}</span>
              <h3>{card.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
