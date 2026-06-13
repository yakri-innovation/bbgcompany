const services = [
  {
    title: "GESTION",
    subtitle: "RH & Comptabilité",
    href: "/gestion#gestion-step-1",
    image: "https://images.pexels.com/photos/7654450/pexels-photo-7654450.jpeg?auto=compress&cs=tinysrgb&w=1200",
    creditLabel: "Pexels · Pavel Danilyuk"
  },
  {
    title: "CRÉATION",
    subtitle: "Création & Reprise",
    href: "/creation#creation-step-1",
    image: "https://images.pexels.com/photos/8424530/pexels-photo-8424530.jpeg?auto=compress&cs=tinysrgb&w=1200",
    creditLabel: "Pexels · Pavel Danilyuk"
  },
  {
    title: "FUSION / ACQUISITION",
    subtitle: "Annonces & Reprise",
    href: "/annonces#annonces-step-1",
    image: "https://images.pexels.com/photos/33175653/pexels-photo-33175653.jpeg?auto=compress&cs=tinysrgb&w=1200",
    creditLabel: "Pexels · Bia Limova"
  }
];

export default function ServiceCards({ compact = false }) {
  const sectionClassName = compact ? "section section-compact-services" : "section";

  return (
    <section className={sectionClassName} id="services">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>Nos services</h2>
        <div className="service-grid">
          {services.map((service) => (
            <a className={`service-card service-card-visual ${compact ? "service-card-compact" : ""}`} key={service.title} href={service.href}>
              <div className="service-photo-wrap">
                <img className="service-photo" src={service.image} alt={service.title} />
                <div className="service-photo-overlay" />
                <div className="service-card-content">
                  <span className="service-kicker">BBG Company</span>
                  <h3>{service.title}</h3>
                  <span className="service-subtitle">{service.subtitle}</span>
                  <div className="service-card-footer">
                    <span className="service-credit">{service.creditLabel}</span>
                    <span className="service-arrow">→</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
