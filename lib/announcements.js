export const announcementCategoryLabels = {
  COMMERCIAL_COMPANY: "Société commerciale",
  BUSINESS_ASSET: "Fonds de commerce",
  REAL_ESTATE_COMPANY: "Société civile immobilière"
};

export const announcementStatusLabels = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé"
};

export const uiCategoryByAnnouncementCategory = {
  COMMERCIAL_COMPANY: "commerciales",
  BUSINESS_ASSET: "fonds",
  REAL_ESTATE_COMPANY: "sci"
};

export const announcementCategoryByUiCategory = {
  commerciales: "COMMERCIAL_COMPANY",
  fonds: "BUSINESS_ASSET",
  sci: "REAL_ESTATE_COMPANY"
};

export const priceBandLabels = {
  "moins-5000": "- 5000 €",
  "plus-5000": "+ 5000 €"
};

export function serializeAnnouncement(announcement) {
  return {
    ...announcement,
    publishedAt: announcement.publishedAt ? announcement.publishedAt.toISOString() : null,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
    uiCategory: uiCategoryByAnnouncementCategory[announcement.category]
  };
}

export function groupAnnouncementsForPublic(announcements) {
  return announcements.reduce(
    (groups, announcement) => {
      const uiCategory = uiCategoryByAnnouncementCategory[announcement.category];

      if (uiCategory) {
        groups[uiCategory].push(serializeAnnouncement(announcement));
      }

      return groups;
    },
    {
      commerciales: [],
      fonds: [],
      sci: []
    }
  );
}
