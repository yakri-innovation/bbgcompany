const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const announcements = [
  {
    title: "Société de services locale",
    slug: "societe-services-locale",
    category: "COMMERCIAL_COMPANY",
    city: "Lille",
    price: "4 500 €",
    priceBand: "moins-5000",
    description: "Société de services locale avec portefeuille client existant et potentiel de reprise rapide.",
    details: { highlights: ["Portefeuille client existant", "Activité locale", "Transmission rapide"] }
  },
  {
    title: "Activité administrative de proximité",
    slug: "activite-administrative-proximite",
    category: "COMMERCIAL_COMPANY",
    city: "Rouen",
    price: "4 900 €",
    priceBand: "moins-5000",
    description: "Activité administrative légère, adaptée à un repreneur souhaitant démarrer avec une structure simple.",
    details: { highlights: ["Structure légère", "Clientèle de proximité", "Faible ticket d'entrée"] }
  },
  {
    title: "Société de transport - Lyon",
    slug: "societe-transport-lyon",
    category: "COMMERCIAL_COMPANY",
    city: "Lyon",
    price: "18 000 €",
    priceBand: "plus-5000",
    description: "Société de transport régionale avec activité opérationnelle et axes de développement identifiés.",
    details: { highlights: ["Activité opérationnelle", "Zone régionale", "Potentiel de développement"] }
  },
  {
    title: "Cabinet de services B2B",
    slug: "cabinet-services-b2b",
    category: "COMMERCIAL_COMPANY",
    city: "Paris",
    price: "32 000 €",
    priceBand: "plus-5000",
    description: "Cabinet orienté services aux entreprises, idéal pour croissance externe ou reprise entrepreneuriale.",
    details: { highlights: ["Services B2B", "Clientèle professionnelle", "Croissance externe"] }
  },
  {
    title: "Restaurant de quartier",
    slug: "restaurant-de-quartier",
    category: "BUSINESS_ASSET",
    city: "Marseille",
    price: "65 000 €",
    priceBand: null,
    description: "Fonds de commerce de restauration avec clientèle locale et emplacement de quartier.",
    details: { highlights: ["Clientèle locale", "Emplacement établi", "Équipements opérationnels"] }
  },
  {
    title: "Commerce de détail",
    slug: "commerce-de-detail-bordeaux",
    category: "BUSINESS_ASSET",
    city: "Bordeaux",
    price: "48 000 €",
    priceBand: null,
    description: "Commerce de détail prêt à reprendre, avec historique d'activité et potentiel de modernisation.",
    details: { highlights: ["Historique d'activité", "Potentiel digital", "Reprise rapide"] }
  },
  {
    title: "Salon de coiffure",
    slug: "salon-de-coiffure-toulouse",
    category: "BUSINESS_ASSET",
    city: "Toulouse",
    price: "39 000 €",
    priceBand: null,
    description: "Salon de coiffure avec clientèle habituée, matériel en place et emplacement accessible.",
    details: { highlights: ["Clientèle habituée", "Matériel en place", "Emplacement accessible"] }
  },
  {
    title: "Activité de services",
    slug: "activite-de-services-lyon",
    category: "BUSINESS_ASSET",
    city: "Lyon",
    price: "54 000 €",
    priceBand: null,
    description: "Fonds de commerce de services avec organisation existante et potentiel commercial.",
    details: { highlights: ["Organisation existante", "Potentiel commercial", "Accompagnement reprise"] }
  },
  {
    title: "SCI spécialisée dans la gestion immobilière",
    slug: "sci-gestion-immobiliere",
    category: "REAL_ESTATE_COMPANY",
    city: "Paris",
    price: "Sur demande",
    priceBand: null,
    description: "SCI spécialisée dans la gestion immobilière, détentrice de plusieurs biens avec revenus locatifs et potentiel de valorisation.",
    details: { highlights: ["Valeur totale des biens immobiliers : 3,5 M€", "Revenus locatifs annuels estimés : 250 000 €", "Type de biens : bureaux et appartements résidentiels", "Localisation : Paris 10ème, Paris 18ème", "Forme de la vente : cession de parts sociales"] }
  },
  {
    title: "SCI patrimoniale familiale",
    slug: "sci-patrimoniale-familiale",
    category: "REAL_ESTATE_COMPANY",
    city: "Nantes",
    price: "420 000 €",
    priceBand: null,
    description: "SCI patrimoniale familiale avec actifs immobiliers stabilisés et gestion simplifiée.",
    details: { highlights: ["Actifs stabilisés", "Gestion simplifiée", "Patrimoine familial"] }
  },
  {
    title: "SCI de rendement locatif",
    slug: "sci-rendement-locatif",
    category: "REAL_ESTATE_COMPANY",
    city: "Lille",
    price: "610 000 €",
    priceBand: null,
    description: "SCI orientée rendement locatif avec biens déjà loués et revenus réguliers.",
    details: { highlights: ["Biens loués", "Revenus réguliers", "Rendement locatif"] }
  }
];

async function main() {
  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { slug: announcement.slug },
      update: {
        title: announcement.title,
        category: announcement.category,
        city: announcement.city,
        price: announcement.price,
        priceBand: announcement.priceBand,
        description: announcement.description,
        details: announcement.details,
        status: "PUBLISHED",
        publishedAt: new Date()
      },
      create: {
        ...announcement,
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
