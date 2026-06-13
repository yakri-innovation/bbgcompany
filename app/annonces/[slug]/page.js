import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AnnouncementInterestForm from "@/components/AnnouncementInterestForm";
import { announcementCategoryLabels, serializeAnnouncement } from "@/lib/announcements";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAnnouncement(slug) {
  const announcement = await prisma.announcement.findFirst({
    where: {
      slug,
      status: "PUBLISHED"
    }
  });

  return announcement ? serializeAnnouncement(announcement) : null;
}

export async function generateMetadata({ params }) {
  const announcement = await getAnnouncement(params.slug);

  if (!announcement) {
    return {
      title: "Annonce introuvable - BBG Company"
    };
  }

  return {
    title: `${announcement.title} - BBG Company`,
    description: announcement.description
  };
}

export default async function AnnouncementDetailPage({ params }) {
  const announcement = await getAnnouncement(params.slug);

  if (!announcement) {
    notFound();
  }

  return (
    <div className="light-page">
      <SiteHeader light />
      <main className="dashboard-shell">
        <div className="container dashboard-grid">
          <section className="dashboard-main">
            <article className="dashboard-card">
              <div className="dashboard-head">
                <div>
                  <span className="kicker">Fiche annonce</span>
                  <h1 style={{ marginTop: 12 }}>{announcement.title}</h1>
                </div>
                <Link className="btn btn-secondary" href="/annonces">
                  Retour au catalogue
                </Link>
              </div>

              <div className="table-like" style={{ marginTop: 20 }}>
                <div className="table-row">
                  <div>
                    <strong>Catégorie</strong>
                    <p>{announcementCategoryLabels[announcement.category]}</p>
                  </div>
                  <div>
                    <strong>Ville</strong>
                    <p>{announcement.city || "Non renseignée"}</p>
                  </div>
                  <div>
                    <strong>Prix</strong>
                    <p>{announcement.price || "Sur demande"}</p>
                  </div>
                  <div>
                    <strong>Publication</strong>
                    <p>{announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString("fr-FR") : "—"}</p>
                  </div>
                </div>
              </div>

              <div className="subsection">
                <h3>Description</h3>
                <p>{announcement.description}</p>
              </div>

              {Array.isArray(announcement.details?.highlights) && announcement.details.highlights.length > 0 && (
                <div className="subsection">
                  <h3>Points clés</h3>
                  <ul className="list-clean">
                    {announcement.details.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          </section>

          <aside className="dashboard-side">
            <AnnouncementInterestForm announcement={announcement} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
