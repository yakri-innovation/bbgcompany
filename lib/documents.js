export const documentStatusLabels = {
  REQUESTED: "Demandé",
  UPLOADED: "Déposé",
  REVIEWING: "Vérification",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  AVAILABLE: "Disponible"
};

export function serializeDocument(document) {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}
