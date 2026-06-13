export const paymentStatusLabels = {
  DRAFT: "Brouillon",
  REQUESTED: "Demandé",
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  CANCELLED: "Annulé"
};

export const documentUploadPaymentGateMessage =
  "Le dépôt de document est indisponible tant qu'un paiement validé n'est pas enregistré pour ce dossier.";

export function isDossierDocumentUploadAllowed(payments) {
  if (!Array.isArray(payments) || payments.length === 0) {
    return false;
  }

  return payments.some((payment) => payment?.status === "PAID");
}

export function serializePayment(payment) {
  return {
    ...payment,
    createdAt: payment.createdAt.toISOString(),
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null
  };
}
