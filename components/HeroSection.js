import Link from "next/link";

const heroPhotos = [
  {
    src: "https://images.pexels.com/photos/30688596/pexels-photo-30688596.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Réunion de direction dans un cabinet en Afrique",
    label: "Cabinet & stratégie"
  },
  {
    src: "https://images.pexels.com/photos/9301291/pexels-photo-9301291.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Équipe de professionnels africains en réunion",
    label: "Conseil & accompagnement"
  },
  {
    src: "https://images.pexels.com/photos/4427622/pexels-photo-4427622.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Experte en cabinet dans un bureau professionnel",
    label: "Expertise dédiée"
  }
];

export default function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-card">
          <span className="kicker">BBG Company</span>
          <h1>Accélérez vos projets d'entreprise.</h1>
          <p>Gestion, création de société et fusion-acquisition — tout en un.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#services">
              Découvrir nos services
            </a>
            <Link className="btn btn-secondary" href="/espace-client">
              Espace client
            </Link>
          </div>
          <div className="stats">
            <div className="stat">
              <strong>3</strong>
              <span>pôles d'expertise</span>
            </div>
            <div className="stat">
              <strong>&lt; 1h</strong>
              <span>réponse ciblée</span>
            </div>
            <div className="stat">
              <strong>100%</strong>
              <span>digital &amp; sécurisé</span>
            </div>
          </div>
        </div>

        <aside className="hero-visual">
          <div className="hero-photo-collage">
            {heroPhotos.map((photo, index) => (
              <article className={`hero-photo-card hero-photo-card-${index + 1}`} key={photo.src}>
                <img src={photo.src} alt={photo.alt} className="hero-photo-image" />
                <div className="hero-photo-overlay" />
                <span className="hero-photo-label">{photo.label}</span>
              </article>
            ))}
            <div className="hero-photo-badge">Afrique & expertise</div>
          </div>
        </aside>
      </div>
    </section>
  );
}
