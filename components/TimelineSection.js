const steps = [
  {
    number: "1",
    title: "Choisissez",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <circle cx="22" cy="18" r="6" fill="#C9A96E" opacity="0.3" />
        <path d="M16 28h12" stroke="#5A483A" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 32h6" stroke="#5A483A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    number: "2",
    title: "Remplissez",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <rect x="12" y="10" width="20" height="24" rx="3" fill="#5A483A" opacity="0.1" />
        <rect x="16" y="16" width="12" height="2" rx="1" fill="#3D2E22" />
        <rect x="16" y="22" width="8" height="2" rx="1" fill="#3D2E22" />
        <rect x="16" y="28" width="10" height="2" rx="1" fill="#3D2E22" opacity="0.4" />
      </svg>
    )
  },
  {
    number: "3",
    title: "Réponse < 1h",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <circle cx="22" cy="22" r="10" stroke="#C9A96E" strokeWidth="2" fill="none" />
        <path d="M22 16v6l4 4" stroke="#5A483A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    number: "4",
    title: "Suivez en ligne",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="12" fill="#F3EDE6" />
        <rect x="12" y="14" width="20" height="16" rx="3" fill="#5A483A" opacity="0.1" />
        <circle cx="22" cy="22" r="4" fill="#C9A96E" opacity="0.3" />
        <path d="M20 22l2 2 4-4" stroke="#3D2E22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

export default function TimelineSection() {
  return (
    <section className="section section-dark">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>Comment ça marche</h2>
        <div className="timeline">
          {steps.map((step, i) => (
            <div className="timeline-step timeline-step-visual" key={step.number}>
              <div className="timeline-icon">{step.icon}</div>
              <span className="timeline-number">{step.number}</span>
              <h3>{step.title}</h3>
              {i < steps.length - 1 && <div className="timeline-connector" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
