import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ServiceCards from "@/components/ServiceCards";
import { announcementCategoryLabels, priceBandLabels, serializeAnnouncement } from "@/lib/announcements";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Catalogue d'annonces",
  description: "Catalogue dynamique des opportunités de fusion, acquisition et reprise BBG Company."
};

const filters = {
  category: {
    all: "Toutes les catégories",
    COMMERCIAL_COMPANY: announcementCategoryLabels.COMMERCIAL_COMPANY,
    BUSINESS_ASSET: announcementCategoryLabels.BUSINESS_ASSET,
    REAL_ESTATE_COMPANY: announcementCategoryLabels.REAL_ESTATE_COMPANY
  },
  band: {
    all: "Tous les niveaux de prix",
    "moins-5000": priceBandLabels["moins-5000"],
    "plus-5000": priceBandLabels["plus-5000"]
  }
};

const PAGE_SIZE = 6;

function getFilterValue(value, allowed) {
  return typeof value === "string" && allowed.includes(value) ? value : "all";
}

function getSearchValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getPageValue(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function buildQueryString({ category, band, city, q, page }) {
  const params = new URLSearchParams();

  if (category !== "all") {
    params.set("category", category);
  }

  if (band !== "all") {
    params.set("band", band);
  }

  if (city) {
    params.set("city", city);
  }

  if (q) {
    params.set("q", q);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/annonces?${query}` : "/annonces";
}

function getPaginationItems(currentPage, totalPages) {
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

async function getAnnouncements({ categoryFilter, bandFilter, cityFilter, queryFilter, requestedPage }) {
  const where = {
    status: "PUBLISHED"
  };

  if (categoryFilter !== "all") {
    where.category = categoryFilter;
  }

  if (bandFilter !== "all") {
    where.priceBand = bandFilter;
  }

  if (cityFilter) {
    where.city = {
      contains: cityFilter,
      mode: "insensitive"
    };
  }

  if (queryFilter) {
    where.OR = [
      {
        title: {
          contains: queryFilter,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: queryFilter,
          mode: "insensitive"
        }
      }
    ];
  }

  const total = await prisma.announcement.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip,
    take: PAGE_SIZE
  });

  return {
    announcements: announcements.map(serializeAnnouncement),
    total,
    totalPages,
    currentPage
  };
}

export default async function AnnoncesPage({ searchParams }) {
  const normalizedCategory = getFilterValue(searchParams?.category, Object.keys(filters.category).filter((item) => item !== "all"));
  const normalizedBand = getFilterValue(searchParams?.band, Object.keys(filters.band).filter((item) => item !== "all"));
  const city = getSearchValue(searchParams?.city);
  const q = getSearchValue(searchParams?.q);
  const requestedPage = getPageValue(searchParams?.page);

  const { announcements, total, totalPages, currentPage } = await getAnnouncements({
    categoryFilter: normalizedCategory,
    bandFilter: normalizedBand,
    cityFilter: city,
    queryFilter: q,
    requestedPage
  });
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="light-page">
      <SiteHeader light />
      <main>
        <ServiceCards compact />
        <section className="section">
          <div className="container">
          <span className="kicker">Step 7 - Catalogue public</span>
          <h1 className="section-title">Catalogue des annonces BBG Company</h1>
          <p className="section-copy">
            Consultez les opportunités disponibles et accédez à chaque fiche annonce détaillée pour envoyer votre intérêt.
          </p>

          <article className="dashboard-card" id="annonces-step-1" tabIndex={-1} style={{ marginBottom: 24 }}>
            <div className="dashboard-head">
              <h3>Filtres</h3>
              <Link className="btn btn-outline" href="/">Retour à l'accueil</Link>
            </div>
            <div className="inline-actions">
              {Object.entries(filters.category).map(([value, label]) => (
                <Link
                  key={value}
                  className={`btn ${normalizedCategory === value ? "btn-primary" : "btn-secondary"}`}
                  href={buildQueryString({
                    category: value,
                    band: normalizedBand,
                    city,
                    q,
                    page: 1
                  })}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="inline-actions" style={{ marginTop: 12 }}>
              {Object.entries(filters.band).map(([value, label]) => (
                <Link
                  key={value}
                  className={`btn ${normalizedBand === value ? "btn-primary" : "btn-secondary"}`}
                  href={buildQueryString({
                    category: normalizedCategory,
                    band: value,
                    city,
                    q,
                    page: 1
                  })}
                >
                  {label}
                </Link>
              ))}
            </div>
            <form className="inline-actions" style={{ marginTop: 16 }} method="get" action="/annonces">
              {normalizedCategory !== "all" && <input type="hidden" name="category" value={normalizedCategory} />}
              {normalizedBand !== "all" && <input type="hidden" name="band" value={normalizedBand} />}
              <input className="btn btn-secondary" type="text" name="city" placeholder="Filtrer par ville" defaultValue={city} style={{ minWidth: 220, textAlign: "left" }} />
              <input className="btn btn-secondary" type="text" name="q" placeholder="Recherche texte" defaultValue={q} style={{ minWidth: 240, textAlign: "left" }} />
              <button className="btn btn-primary" type="submit">Appliquer</button>
              <Link className="btn btn-outline" href={buildQueryString({ category: normalizedCategory, band: normalizedBand, city: "", q: "", page: 1 })}>
                Réinitialiser recherche
              </Link>
            </form>
          </article>

          <div className="annonce-grid">
            {announcements.map((announcement) => (
              <article className="annonce-card" key={announcement.id}>
                <span className="tag">{announcement.city || "Ville non renseignée"}</span>
                <h3>{announcement.title}</h3>
                <p>{announcement.description}</p>
                <p>
                  <strong>{announcement.price || "Prix sur demande"}</strong> · {announcementCategoryLabels[announcement.category]}
                </p>
                <div className="inline-actions" style={{ marginTop: 14 }}>
                  <Link className="btn btn-primary" href={`/annonces/${announcement.slug}`}>
                    Voir la fiche
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <article className="dashboard-card" style={{ marginTop: 24 }}>
            <div className="dashboard-head">
              <p>{total} annonce(s) · page {currentPage} / {totalPages}</p>
              <div className="inline-actions">
                <Link
                  className="btn btn-outline"
                  href={buildQueryString({
                    category: normalizedCategory,
                    band: normalizedBand,
                    city,
                    q,
                    page: Math.max(1, currentPage - 1)
                  })}
                >
                  Précédent
                </Link>
                {paginationItems.map((page) => (
                  <Link
                    key={page}
                    className={`btn ${page === currentPage ? "btn-primary" : "btn-secondary"}`}
                    href={buildQueryString({
                      category: normalizedCategory,
                      band: normalizedBand,
                      city,
                      q,
                      page
                    })}
                  >
                    {page}
                  </Link>
                ))}
                <Link
                  className="btn btn-outline"
                  href={buildQueryString({
                    category: normalizedCategory,
                    band: normalizedBand,
                    city,
                    q,
                    page: Math.min(totalPages, currentPage + 1)
                  })}
                >
                  Suivant
                </Link>
              </div>
            </div>
          </article>

          {announcements.length === 0 && (
            <div className="notice" style={{ marginTop: 24 }}>
              Aucune annonce ne correspond aux filtres sélectionnés.
            </div>
          )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
