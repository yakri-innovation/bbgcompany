"use client";

import { useEffect, useState, useRef } from "react";

// Hook pour scroll automatique vers la prochaine étape
function useScrollToNext(deps) {
  const ref = useRef(null);
  const depsArray = Array.isArray(deps) ? deps : [deps];

  useEffect(() => {
    const hasValue = depsArray.some((value) => value);
    if (hasValue && ref.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, depsArray);
  return ref;
}

const activityOptions = ["BTP / Transport", "Service à la personne", "Banque et assurance", "Administratif", "Autres"];
const CREATION_DRAFT_KEY = "bbg_creation_draft_v1";
const TOTAL_CREATION_STEPS = 12;

function createShareholder(index) {
  return {
    id: index,
    firstName: "",
    lastName: "",
    birthDate: "",
    birthPlace: "",
    nationality: "",
    address: "",
    familyStatus: "Célibataire",
    percentage: "",
    isDirector: "",
    role: "",
    partnerManager: "",
    partnerDuration: ""
  };
}

export default function CreationSection() {
  const [projectType, setProjectType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [shareholderMode, setShareholderMode] = useState("");
  const [shareholderCount, setShareholderCount] = useState(1);
  const [shareholders, setShareholders] = useState([createShareholder(1)]);
  const [managerPaid, setManagerPaid] = useState("");
  const [externalManager, setExternalManager] = useState({
    lastName: "",
    firstName: "",
    birthDate: "",
    birthPlace: "",
    nationality: "",
    address: "",
    familyStatus: "Célibataire",
    monthlyPay: ""
  });
  const [activityDomain, setActivityDomain] = useState("");
  const [startMode, setStartMode] = useState("");
  const [socialObject, setSocialObject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [hasSiege, setHasSiege] = useState("");
  const [siegeAddress, setSiegeAddress] = useState("");
  const [siegePartnerDuration, setSiegePartnerDuration] = useState("");
  const [capitalPartner, setCapitalPartner] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [fiscaliteKnown, setFiscaliteKnown] = useState("");
  const [fiscaliteDetail, setFiscaliteDetail] = useState("");
  const [fiscaliteChoice, setFiscaliteChoice] = useState("");
  const [tva, setTva] = useState("");
  const [tvaReason, setTvaReason] = useState("");
  const [particularites, setParticularites] = useState("");
  const [particularitesDetail, setParticularitesDetail] = useState("");
  const [immatriculationService, setImmatriculationService] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isValidatingLead, setIsValidatingLead] = useState(false);
  const [isLeadSubmitted, setIsLeadSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);

  // Refs pour scroll automatique
  const step2Ref = useScrollToNext(projectType);
  const step3Ref = useScrollToNext([companyName, legalForm]);
  const step4Ref = useScrollToNext(shareholderMode);
  const stepSiegeRef = useScrollToNext(startMode);
  const stepCapitalRef = useScrollToNext(hasSiege);
  const stepFiscaliteRef = useScrollToNext(capitalPartner);
  const stepTvaRef = useScrollToNext([fiscaliteChoice, fiscaliteDetail]);
  const stepParticularitesRef = useScrollToNext(tva);
  const stepImmatRef = useScrollToNext(particularites);

  const updateShareholder = (id, field, value) => {
    setShareholders((current) =>
      current.map((shareholder) => {
        if (shareholder.id !== id) {
          return shareholder;
        }

        if (field === "isDirector" && value === "non") {
          return { ...shareholder, isDirector: value, role: "", partnerManager: shareholder.partnerManager, partnerDuration: shareholder.partnerDuration };
        }

        if (field === "isDirector" && value === "oui") {
          return { ...shareholder, isDirector: value, partnerManager: "", partnerDuration: "" };
        }

        if (field === "partnerManager" && value === "non") {
          return { ...shareholder, partnerManager: value, partnerDuration: "" };
        }

        return { ...shareholder, [field]: value };
      })
    );
  };

  const handleShareholderMode = (value) => {
    setShareholderMode(value);
    const count = value === "1" ? 1 : Math.max(2, shareholderCount);
    setShareholderCount(count);
    setShareholders(Array.from({ length: count }, (_, index) => createShareholder(index + 1)));
  };

  const handleShareholderCountChange = (value) => {
    const parsed = Math.max(1, Number(value) || 1);
    setShareholderCount(parsed);
    setShareholders((current) => {
      const next = Array.from({ length: parsed }, (_, index) => current[index] || createShareholder(index + 1));
      return next;
    });
  };

  const selectedPresidentCount = shareholders.filter((shareholder) => shareholder.role === "Président").length;
  const hasInternalRepresentative = shareholders.some((shareholder) => shareholder.isDirector === "oui" && shareholder.role);
  const needsExternalRepresentative =
    !hasInternalRepresentative && shareholders.some((shareholder) => shareholder.isDirector === "non" && shareholder.partnerManager === "non");
  const shareholdersReady = shareholders.every((shareholder) => shareholder.isDirector !== "");

  const updateExternalManager = (field, value) => {
    setExternalManager((current) => ({ ...current, [field]: value }));
  };

  const getSequentialCompletionCount = () => {
    const stepChecks = [
      Boolean(projectType),
      Boolean(projectType && companyName && legalForm),
      Boolean(shareholderMode),
      Boolean(shareholdersReady && (!needsExternalRepresentative || managerPaid)),
      Boolean(activityDomain && startMode && socialObject),
      Boolean(hasSiege && (hasSiege === "oui" ? siegeAddress : siegePartnerDuration)),
      Boolean(capitalAmount && capitalPartner),
      Boolean(fiscaliteKnown && (fiscaliteKnown === "oui" ? fiscaliteDetail : fiscaliteChoice)),
      Boolean(tva && (tva === "oui" ? tvaReason : true)),
      Boolean(particularites && (particularites === "oui" ? particularitesDetail : true)),
      Boolean(immatriculationService),
      Boolean(isLeadSubmitted)
    ];

    let completed = 0;

    for (const check of stepChecks) {
      if (!check) {
        break;
      }

      completed += 1;
    }

    return completed;
  };

  const completedSteps = getSequentialCompletionCount();
  const currentStep = Math.min(completedSteps + 1, TOTAL_CREATION_STEPS);
  const progressPercent = Math.round((completedSteps / TOTAL_CREATION_STEPS) * 100);

  const buildRecapPayload = () => ({
    projectType,
    companyName,
    legalForm,
    shareholderMode,
    shareholderCount,
    shareholders,
    externalManager,
    managerPaid,
    activityDomain,
    startMode,
    socialObject,
    startDate,
    hasSiege,
    siegeAddress,
    siegePartnerDuration,
    capitalAmount,
    capitalPartner,
    fiscaliteKnown,
    fiscaliteDetail,
    fiscaliteChoice,
    tvaFranchise: tva,
    tva,
    tvaReason,
    particularites,
    particularitesDetail,
    immatriculationService,
    clientEmail,
    clientPhone
  });

  const applyDraft = (draft) => {
    const nextShareholders =
      Array.isArray(draft.shareholders) && draft.shareholders.length > 0
        ? draft.shareholders.map((shareholder, index) => ({
            ...createShareholder(index + 1),
            ...shareholder,
            id: index + 1
          }))
        : [createShareholder(1)];

    setProjectType(draft.projectType || "");
    setCompanyName(draft.companyName || "");
    setLegalForm(draft.legalForm || "");
    setShareholderMode(draft.shareholderMode || "");
    setShareholderCount(Math.max(1, Number(draft.shareholderCount) || nextShareholders.length));
    setShareholders(nextShareholders);
    setManagerPaid(draft.managerPaid || "");
    setExternalManager({
      lastName: "",
      firstName: "",
      birthDate: "",
      birthPlace: "",
      nationality: "",
      address: "",
      familyStatus: "Célibataire",
      monthlyPay: "",
      ...(draft.externalManager && typeof draft.externalManager === "object" ? draft.externalManager : {})
    });
    setActivityDomain(draft.activityDomain || "");
    setStartMode(draft.startMode || "");
    setSocialObject(draft.socialObject || "");
    setStartDate(draft.startDate || "");
    setHasSiege(draft.hasSiege || "");
    setSiegeAddress(draft.siegeAddress || "");
    setSiegePartnerDuration(draft.siegePartnerDuration || "");
    setCapitalPartner(draft.capitalPartner || "");
    setCapitalAmount(draft.capitalAmount || "");
    setFiscaliteKnown(draft.fiscaliteKnown || "");
    setFiscaliteDetail(draft.fiscaliteDetail || "");
    setFiscaliteChoice(draft.fiscaliteChoice || "");
    setTva(draft.tva || draft.tvaFranchise || "");
    setTvaReason(draft.tvaReason || "");
    setParticularites(draft.particularites || "");
    setParticularitesDetail(draft.particularitesDetail || "");
    setImmatriculationService(draft.immatriculationService || "");
    setClientEmail(draft.clientEmail || "");
    setClientPhone(draft.clientPhone || "");
    setLeadStatus("Brouillon restauré.");
  };

  const handleRestoreDraft = () => {
    const rawDraft = window.localStorage.getItem(CREATION_DRAFT_KEY);

    if (!rawDraft) {
      setLeadStatus("Aucun brouillon disponible.");
      return;
    }

    try {
      const parsedDraft = JSON.parse(rawDraft);
      applyDraft(parsedDraft);
      setDraftAvailable(true);
    } catch {
      setLeadStatus("Le brouillon n'a pas pu être restauré.");
    }
  };

  const handleClearDraft = () => {
    window.localStorage.removeItem(CREATION_DRAFT_KEY);
    setDraftAvailable(false);
    setLeadStatus("Brouillon supprimé.");
  };

  const focusStep = (step) => {
    const element = document.querySelector(`[data-validation-step="${step}"]`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const validateCreationForm = () => {
    const errors = {};
    const hasValidShareholder = shareholders.some(
      (shareholder) => toAsciiText(shareholder?.firstName) && toAsciiText(shareholder?.lastName)
    );

    if (!companyName.trim() || !legalForm.trim()) {
      errors.step2 = "Merci de renseigner le nom de société et la forme juridique.";
    }

    if (!hasValidShareholder) {
      errors.step3 = "Merci de renseigner au moins un actionnaire (nom et prénom).";
    }

    if (tva === "oui" && !tvaReason.trim()) {
      errors.step9 = "Merci d'indiquer les raisons de la franchise de TVA.";
    }

    if (particularites === "oui" && !particularitesDetail.trim()) {
      errors.step10 = "Merci de préciser les particularités complémentaires.";
    }

    if (!immatriculationService) {
      errors.step11 = "Merci de préciser votre choix pour les démarches d'immatriculation.";
    }

    if (!clientEmail.trim() || !clientPhone.trim()) {
      errors.step12 = "Merci de renseigner votre email et votre téléphone pour finaliser la demande.";
    }

    return errors;
  };

  const toAsciiText = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, " ")
      .trim();

  const escapePdfText = (value) =>
    toAsciiText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const wrapText = (label, value, maxChars = 78) => {
    const fullText = `${label}: ${value}`.trim();

    if (fullText.length <= maxChars) {
      return [fullText];
    }

    const words = fullText.split(/\s+/);
    const wrapped = [];
    let currentLine = "";

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (nextLine.length > maxChars) {
        if (currentLine) {
          wrapped.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = nextLine;
      }
    }

    if (currentLine) {
      wrapped.push(currentLine);
    }

    return wrapped;
  };

  const buildProfessionalPdf = (payload) => {
    const content = [];
    let y = 735;
    const referenceId = `BBG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;

    const setFillColor = (r, g, b) => {
      content.push(`${r} ${g} ${b} rg`);
    };

    const addText = (text, x, size = 11, font = "F1") => {
      content.push("BT");
      content.push(`/${font} ${size} Tf`);
      content.push(`${x} ${y} Td`);
      content.push(`(${escapePdfText(text)}) Tj`);
      content.push("ET");
    };

    const moveDown = (amount) => {
      y -= amount;
    };

    const addDivider = () => {
      content.push("0.84 0.84 0.84 RG");
      content.push(`40 ${y} m 555 ${y} l S`);
      moveDown(16);
    };

    const addSectionTitle = (title) => {
      addText(title, 40, 12, "F2");
      moveDown(18);
    };

    const addField = (label, value) => {
      if (!value) {
        return;
      }

      const lines = wrapText(label, value);
      lines.forEach((line) => {
        addText(line, 40, 10, "F1");
        moveDown(14);
      });
    };

    setFillColor("0.4196", "0.3569", "0.3098");
    content.push("0 760 595 82 re f");

    const logoX = 40;
    const logoY = 772;
    const logoW = 120;
    const logoH = 54;

    setFillColor("0.4196", "0.3569", "0.3098");
    content.push(`${logoX} ${logoY} ${logoW} ${logoH} re f`);
    setFillColor("0.9608", "0.9412", "0.9216");

    y = logoY + 36;
    addText("B", logoX + 24, 20, "F2");
    y = logoY + 36;
    addText("B", logoX + 50, 20, "F2");
    y = logoY + 36;
    addText("G", logoX + 76, 20, "F2");

    content.push("0.9608 0.9412 0.9216 RG");
    content.push("0.8 w");
    content.push(`${logoX + 44} ${logoY + 14} m ${logoX + 44} ${logoY + 41} l S`);
    content.push(`${logoX + 70} ${logoY + 14} m ${logoX + 70} ${logoY + 41} l S`);

    y = logoY + 10;
    addText("COMPANY", logoX + 29, 8, "F1");

    setFillColor("0.9608", "0.9412", "0.9216");
    y = 804;
    addText("BBG COMPANY", 185, 18, "F2");
    y = 783;
    addText("Recapitulatif - Creation d'entreprise", 185, 10, "F1");
    y = 798;
    addText(`Reference dossier: ${referenceId}`, 395, 10, "F1");

    setFillColor("0.1216", "0.1216", "0.1216");

    y = 735;
    addText(`Genere le ${new Date().toLocaleString("fr-FR")}`, 40, 9, "F1");
    moveDown(22);
    addDivider();

    addSectionTitle("1. Informations du projet");
    addField("Type de projet", payload.projectType);
    addField("Nom de societe", payload.companyName);
    addField("Forme juridique", payload.legalForm);
    addField("Domaine d activite", payload.activityDomain);
    addField("Mode de demarrage", payload.startMode);
    addField("Objet social", payload.socialObject);
    addField("Date de debut", payload.startDate);
    addField("Email de contact", payload.clientEmail);
    addField("Telephone de contact", payload.clientPhone);
    addDivider();

    addSectionTitle("2. Parametres fiscaux et financiers");
    addField("Capital", payload.capitalAmount);
    addField("Franchise de TVA", payload.tva);
    addField("Raison TVA", payload.tvaReason);
    addField("Particularites", payload.particularitesDetail || payload.particularites);
    addDivider();

    addSectionTitle("3. Immatriculation et actionnaires");
    addField("Accompagnement immatriculation", payload.immatriculationService);

    if (Array.isArray(payload.shareholders) && payload.shareholders.length > 0) {
      payload.shareholders.forEach((shareholder, index) => {
        const identity = [shareholder.firstName, shareholder.lastName].filter(Boolean).join(" ").trim() || `Actionnaire ${index + 1}`;
        addField(`Actionnaire ${index + 1}`, identity);
      });
    }

    if (y < 190) {
      y = 190;
    }

    moveDown(6);
    addSectionTitle("4. Validation du dossier");

    const tableX = 40;
    const tableY = y;
    const tableWidth = 515;
    const headerHeight = 20;
    const rowHeight = 36;

    content.push("0.9 0.9 0.9 rg");
    content.push(`${tableX} ${tableY - headerHeight} ${tableWidth} ${headerHeight} re f`);
    content.push("0.62 0.62 0.62 RG");
    content.push(`${tableX} ${tableY} m ${tableX + tableWidth} ${tableY} l S`);
    content.push(`${tableX} ${tableY - headerHeight - rowHeight} m ${tableX + tableWidth} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX} ${tableY} m ${tableX} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX + tableWidth} ${tableY} m ${tableX + tableWidth} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX + 185} ${tableY} m ${tableX + 185} ${tableY - headerHeight - rowHeight} l S`);
    content.push(`${tableX + 330} ${tableY} m ${tableX + 330} ${tableY - headerHeight - rowHeight} l S`);

    setFillColor("0.1216", "0.1216", "0.1216");
    y = tableY - 14;
    addText("Signature client", tableX + 10, 9, "F2");
    y = tableY - 14;
    addText("Date", tableX + 195, 9, "F2");
    y = tableY - 14;
    addText("Conseiller BBG", tableX + 340, 9, "F2");

    y = tableY - 38;
    addText("...............................", tableX + 10, 9, "F1");
    y = tableY - 38;
    addText("..... / ..... / ..........", tableX + 195, 9, "F1");
    y = tableY - 38;
    addText("...............................", tableX + 340, 9, "F1");

    y = 44;
    addText("Document genere automatiquement par BBG Company.", 40, 8, "F1");
    addText("Page 1/1", 515, 8, "F1");

    const streamContent = content.join("\n");
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
      `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
    ];

    objects[2] =
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n";

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((objectContent) => {
      offsets.push(pdf.length);
      pdf += objectContent;
    });

    const xrefPosition = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let index = 1; index <= objects.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

    return pdf;
  };

  const handleDownloadRecap = () => {
    const payload = buildRecapPayload();
    const pdfContent = buildProfessionalPdf(payload);
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `bbg-recap-creation-${dateStamp}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLeadSubmit = async () => {
    setIsValidatingLead(true);
    const errors = validateCreationForm();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLeadStatus("Merci de corriger les informations manquantes avant l'envoi.");
      setIsLeadSubmitted(false);
      setIsValidatingLead(false);
      const firstStepInError = Object.keys(errors)[0]?.replace("step", "");

      if (firstStepInError) {
        focusStep(firstStepInError);
      }

      return;
    }

    setValidationErrors({});

    if (!immatriculationService) {
      setLeadStatus("Merci de finaliser le parcours avant l'envoi.");
      setIsLeadSubmitted(false);
      setIsValidatingLead(false);
      return;
    }

    setLeadStatus("");
    setIsLeadSubmitted(false);
    setIsSubmittingLead(true);
    setIsValidatingLead(false);

    const payload = buildRecapPayload();

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: projectType === "reprise" ? "REPRISE" : "CREATION",
          source: "creation-section",
          firstName: shareholders[0]?.firstName,
          lastName: shareholders[0]?.lastName,
          email: clientEmail,
          phone: clientPhone,
          payload
        })
      });

      if (!response.ok) {
        setLeadStatus("Impossible d'enregistrer votre demande pour le moment.");
        setIsLeadSubmitted(false);
        return;
      }

      setLeadStatus("Votre demande a bien été enregistrée. Un conseiller BBG Company va préparer la suite de votre dossier.");
      setIsLeadSubmitted(true);
    } catch (error) {
      console.error("Lead submit failed", error);
      setLeadStatus("Erreur technique lors de l'envoi. Merci de réessayer dans quelques instants.");
      setIsLeadSubmitted(false);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  useEffect(() => {
    const preferredProjectType = window.localStorage.getItem("bbg_creation_project_type");

    if (preferredProjectType === "reprise") {
      setProjectType("reprise");
      window.localStorage.removeItem("bbg_creation_project_type");
    }

    const rawDraft = window.localStorage.getItem(CREATION_DRAFT_KEY);

    if (rawDraft) {
      setDraftAvailable(true);

      try {
        const parsedDraft = JSON.parse(rawDraft);
        applyDraft(parsedDraft);
      } catch {
        setLeadStatus("Un brouillon a été détecté mais n'a pas pu être restauré.");
      }
    }

    setIsDraftReady(true);
  }, []);

  useEffect(() => {
    if (!isDraftReady) {
      return;
    }

    const saveTimeout = setTimeout(() => {
      window.localStorage.setItem(CREATION_DRAFT_KEY, JSON.stringify(buildRecapPayload()));
      setDraftAvailable(true);
    }, 500);

    return () => {
      window.clearTimeout(saveTimeout);
    };
  }, [
    isDraftReady,
    projectType,
    companyName,
    legalForm,
    shareholderMode,
    shareholderCount,
    shareholders,
    managerPaid,
    externalManager,
    activityDomain,
    startMode,
    socialObject,
    startDate,
    hasSiege,
    siegeAddress,
    siegePartnerDuration,
    capitalPartner,
    capitalAmount,
    fiscaliteKnown,
    fiscaliteDetail,
    fiscaliteChoice,
    tva,
    tvaReason,
    particularites,
    particularitesDetail,
    immatriculationService,
    clientEmail,
    clientPhone
  ]);

  return (
    <section className="section section-dark" id="creation">
      <div className="container">
        <span className="kicker">Service 2</span>
        <h2 className="section-title">Créer votre société avec un parcours clair, premium et structuré.</h2>
        <p className="section-copy">
          Ce formulaire dynamique multi-étapes simplifie la collecte d'informations et alimente directement votre espace client pour le suivi de votre dossier.
        </p>

        <div className="form-card" style={{ marginBottom: 18 }}>
          <div className="dashboard-head" style={{ marginBottom: 12 }}>
            <div>
              <strong>Progression du parcours</strong>
              <p>Étape {currentStep} / {TOTAL_CREATION_STEPS} · {progressPercent}% complété</p>
            </div>
            <div className="inline-actions">
              <button className="btn btn-outline" type="button" onClick={handleRestoreDraft} disabled={!draftAvailable}>
                Reprendre mon brouillon
              </button>
              <button className="btn btn-outline" type="button" onClick={handleClearDraft} disabled={!draftAvailable}>
                Effacer le brouillon
              </button>
            </div>
          </div>
          <div style={{ height: 10, background: "rgba(0,0,0,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "var(--gold)",
                transition: "width 0.35s ease"
              }}
            />
          </div>
        </div>

        <div className="questionnaire-shell">
          <article className="form-card question-card" id="creation-step-1" tabIndex={-1}>
            <div className="question-step">Étape 1</div>
            <h3>Choisissez votre projet</h3>
            <div className="choice-group question-choices">
              <button className={`choice-pill ${projectType === "creation" ? "selected" : ""}`} onClick={() => setProjectType("creation")}>
                Création
              </button>
              <button className={`choice-pill ${projectType === "reprise" ? "selected" : ""}`} onClick={() => setProjectType("reprise")}>
                Reprise d'une de nos annonces
              </button>
            </div>
          </article>

          {projectType && (
            <article className="form-card question-card" ref={step2Ref} data-validation-step="2">
              <div className="question-step">Étape 2</div>
              <div className="form-grid">
                <div className="field">
                  <label>Quel sera le nom de votre société ?</label>
                  <input type="text" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Nom de la société" />
                </div>
                <div className="field">
                  <label>Avez-vous une forme juridique que vous souhaiteriez précisément ?</label>
                  <select value={legalForm} onChange={(event) => setLegalForm(event.target.value)}>
                    <option value="">Sélectionnez une forme</option>
                    <option value="SAS">SAS</option>
                    <option value="SASU">SASU</option>
                    <option value="SARL">SARL</option>
                    <option value="EURL">EURL</option>
                    <option value="SCI">SCI</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
              {validationErrors.step2 && <div className="subsection notice">{validationErrors.step2}</div>}
            </article>
          )}

          {companyName && legalForm && (
            <article className="form-card question-card" ref={step3Ref} data-validation-step="3">
              <div className="question-step">Étape 3</div>
              <h3>Combien y aura-t-il d'actionnaires ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${shareholderMode === "1" ? "selected" : ""}`} onClick={() => handleShareholderMode("1")}>
                  1
                </button>
                <button className={`choice-pill ${shareholderMode === "plusieurs" ? "selected" : ""}`} onClick={() => handleShareholderMode("plusieurs")}>
                  Plusieurs
                </button>
              </div>
              {shareholderMode === "plusieurs" && (
                <div className="subsection field question-field-single">
                  <label>Saisir quantité d'actionnaires</label>
                  <input type="number" min="2" value={shareholderCount} onChange={(event) => handleShareholderCountChange(event.target.value)} />
                </div>
              )}
              {validationErrors.step3 && <div className="subsection notice">{validationErrors.step3}</div>}
            </article>
          )}

          {shareholderMode && (
            <div className="questionnaire-stack" ref={step4Ref}>
              {shareholders.map((shareholder, index) => (
                <article className="form-card question-card" key={shareholder.id}>
                  <div className="question-step">Actionnaire {index + 1}</div>
                  <h3>Remplissez les champs suivants pour cet actionnaire</h3>
                  <div className="form-grid">
                    <div className="field">
                      <label>Nom</label>
                      <input type="text" value={shareholder.lastName} onChange={(event) => updateShareholder(shareholder.id, "lastName", event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Prénom</label>
                      <input type="text" value={shareholder.firstName} onChange={(event) => updateShareholder(shareholder.id, "firstName", event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Date de naissance</label>
                      <input type="date" value={shareholder.birthDate} onChange={(event) => updateShareholder(shareholder.id, "birthDate", event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Lieu de naissance</label>
                      <input type="text" placeholder="Lieu de naissance" value={shareholder.birthPlace} onChange={(event) => updateShareholder(shareholder.id, "birthPlace", event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Nationalité</label>
                      <input type="text" placeholder="Nationalité" value={shareholder.nationality} onChange={(event) => updateShareholder(shareholder.id, "nationality", event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Adresse</label>
                      <input type="text" placeholder="Adresse" value={shareholder.address} onChange={(event) => updateShareholder(shareholder.id, "address", event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Situation familiale</label>
                      <select value={shareholder.familyStatus} onChange={(event) => updateShareholder(shareholder.id, "familyStatus", event.target.value)}>
                        <option value="Célibataire">Célibataire</option>
                        <option value="Marié">Marié</option>
                        <option value="Concubinage">Concubinage</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>% dans la société</label>
                      <input type="number" placeholder="Pourcentage" value={shareholder.percentage} onChange={(event) => updateShareholder(shareholder.id, "percentage", event.target.value)} />
                    </div>
                  </div>

                  <div className="subsection">
                    <div className="question-step">Direction</div>
                    <h3>Cet actionnaire sera-t-il un des dirigeants ?</h3>
                    <div className="choice-group question-choices">
                      <button className={`choice-pill ${shareholder.isDirector === "oui" ? "selected" : ""}`} onClick={() => updateShareholder(shareholder.id, "isDirector", "oui")}>
                        Oui
                      </button>
                      <button className={`choice-pill ${shareholder.isDirector === "non" ? "selected" : ""}`} onClick={() => updateShareholder(shareholder.id, "isDirector", "non")}>
                        Non
                      </button>
                    </div>
                  </div>

                  {shareholder.isDirector === "oui" && (
                    <div className="subsection field question-field-single">
                      <label>Si oui, sera-t-il le Président ou le Directeur général ?</label>
                      <select value={shareholder.role} onChange={(event) => updateShareholder(shareholder.id, "role", event.target.value)}>
                        <option value="">Sélectionnez un rôle</option>
                        <option value="Président" disabled={selectedPresidentCount > 0 && shareholder.role !== "Président"}>
                          Président
                        </option>
                        <option value="Directeur général">Directeur général</option>
                      </select>
                    </div>
                  )}

                  {shareholder.isDirector === "non" && (
                    <div className="subsection">
                      <h3>Souhaitez-vous bénéficier des services de notre partenaire pour la gérance de votre société ?</h3>
                      <div className="choice-group question-choices">
                        <button className={`choice-pill ${shareholder.partnerManager === "oui" ? "selected" : ""}`} onClick={() => updateShareholder(shareholder.id, "partnerManager", "oui")}>
                          Oui
                        </button>
                        <button className={`choice-pill ${shareholder.partnerManager === "non" ? "selected" : ""}`} onClick={() => updateShareholder(shareholder.id, "partnerManager", "non")}>
                          Non
                        </button>
                      </div>

                      {shareholder.partnerManager === "oui" && (
                        <div className="subsection">
                          <h3>Si oui : souhaitez vous bénéficier de ses services pour</h3>
                          <div className="choice-group question-choices">
                            <button className={`choice-pill ${shareholder.partnerDuration === "1 an" ? "selected" : ""}`} onClick={() => updateShareholder(shareholder.id, "partnerDuration", "1 an")}>
                              1 an (499€/mois)
                            </button>
                            <button className={`choice-pill ${shareholder.partnerDuration === "3 ans" ? "selected" : ""}`} onClick={() => updateShareholder(shareholder.id, "partnerDuration", "3 ans")}>
                              3 ans (299€/mois)
                            </button>
                          </div>
                          {shareholder.partnerDuration && <div className="subsection notice">Un procès-verbal à faire signer par l'ensemble des actionnaires vous sera envoyé.</div>}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}

              <article className="form-card question-card result-card">
                <div className="question-step">Règle métier</div>
                <p>
                  Attention : il n'est pas possible sur la même société de sélectionner plusieurs fois <strong>Président</strong>, mais plusieurs <strong>Directeurs généraux</strong> sont possibles.
                </p>
              </article>
            </div>
          )}

          {shareholdersReady && needsExternalRepresentative && (
            <article className="form-card question-card">
              <div className="question-step">Étape 4</div>
              <h3>Indiquez les informations liées au gérant / représentant légal</h3>
              <div className="form-grid">
                <div className="field">
                  <label>Nom</label>
                  <input type="text" placeholder="Nom" value={externalManager.lastName} onChange={(event) => updateExternalManager("lastName", event.target.value)} />
                </div>
                <div className="field">
                  <label>Prénom</label>
                  <input type="text" placeholder="Prénom" value={externalManager.firstName} onChange={(event) => updateExternalManager("firstName", event.target.value)} />
                </div>
                <div className="field">
                  <label>Date de naissance</label>
                  <input type="date" value={externalManager.birthDate} onChange={(event) => updateExternalManager("birthDate", event.target.value)} />
                </div>
                <div className="field">
                  <label>Lieu de naissance</label>
                  <input type="text" placeholder="Lieu de naissance" value={externalManager.birthPlace} onChange={(event) => updateExternalManager("birthPlace", event.target.value)} />
                </div>
                <div className="field">
                  <label>Nationalité</label>
                  <input type="text" placeholder="Nationalité" value={externalManager.nationality} onChange={(event) => updateExternalManager("nationality", event.target.value)} />
                </div>
                <div className="field">
                  <label>Adresse</label>
                  <input type="text" placeholder="Adresse" value={externalManager.address} onChange={(event) => updateExternalManager("address", event.target.value)} />
                </div>
                <div className="field">
                  <label>Situation familiale</label>
                  <select value={externalManager.familyStatus} onChange={(event) => updateExternalManager("familyStatus", event.target.value)}>
                    <option value="Célibataire">Célibataire</option>
                    <option value="Marié">Marié</option>
                    <option value="Concubinage">Concubinage</option>
                  </select>
                </div>
              </div>
              <div className="subsection">
                <h3>Ce gérant sera-t-il rémunéré ?</h3>
                <div className="choice-group question-choices">
                  <button className={`choice-pill ${managerPaid === "oui" ? "selected" : ""}`} onClick={() => setManagerPaid("oui")}>
                    Oui
                  </button>
                  <button className={`choice-pill ${managerPaid === "non" ? "selected" : ""}`} onClick={() => setManagerPaid("non")}>
                    Non
                  </button>
                </div>
              </div>
              {managerPaid === "oui" && (
                <div className="subsection field question-field-single">
                  <label>Si oui combien par mois ?</label>
                  <input type="text" placeholder="Montant mensuel" value={externalManager.monthlyPay} onChange={(event) => updateExternalManager("monthlyPay", event.target.value)} />
                </div>
              )}
            </article>
          )}

          {shareholdersReady && (!needsExternalRepresentative || managerPaid) && (
            <article className="form-card question-card">
              <div className="question-step">Étape 5</div>
              <div className="form-grid">
                <div className="field">
                  <label>Quel sera le domaine d'activité de votre société ?</label>
                  <select value={activityDomain} onChange={(event) => setActivityDomain(event.target.value)}>
                    <option value="">Sélectionnez votre domaine</option>
                    {activityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Quand souhaitez-vous démarrer l'activité ?</label>
                  <select value={startMode} onChange={(event) => setStartMode(event.target.value)}>
                    <option value="">Sélectionnez une option</option>
                    <option value="tot">Le plus tôt possible</option>
                    <option value="date">Choisir une date</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Indiquez précisément l'objet social</label>
                  <textarea placeholder="Ex : activité de conseil, gestion, exploitation..." value={socialObject} onChange={(event) => setSocialObject(event.target.value)} />
                </div>
              </div>
              {startMode === "date" && (
                <div className="subsection field question-field-single">
                  <label>Date souhaitée de démarrage</label>
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
              )}
            </article>
          )}

          {activityDomain && startMode && (
            <article className="form-card question-card" ref={stepSiegeRef}>
              <div className="question-step">Étape 6</div>
              <h3>Avez-vous le siège social de votre société ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${hasSiege === "oui" ? "selected" : ""}`} onClick={() => setHasSiege("oui")}>
                  Oui
                </button>
                <button className={`choice-pill ${hasSiege === "non" ? "selected" : ""}`} onClick={() => setHasSiege("non")}>
                  Non
                </button>
              </div>
              {hasSiege === "oui" && (
                <div className="subsection field question-field-single">
                  <label>Indiquez l'adresse précise</label>
                  <input type="text" placeholder="Adresse du siège social" value={siegeAddress} onChange={(event) => setSiegeAddress(event.target.value)} />
                </div>
              )}
              {hasSiege === "non" && (
                <div className="subsection">
                  <h3>Si non : bénéficiez des services de l'un de nos partenaires</h3>
                  <div className="choice-group question-choices">
                    <button className={`choice-pill ${siegePartnerDuration === "1 an" ? "selected" : ""}`} onClick={() => setSiegePartnerDuration("1 an")}>
                      1 an (99€/mois)
                    </button>
                    <button className={`choice-pill ${siegePartnerDuration === "3 ans" ? "selected" : ""}`} onClick={() => setSiegePartnerDuration("3 ans")}>
                      3 ans (89€/mois)
                    </button>
                  </div>
                </div>
              )}
            </article>
          )}

          {hasSiege && (
            <article className="form-card question-card" ref={stepCapitalRef}>
              <div className="question-step">Étape 7</div>
              <div className="form-grid">
                <div className="field">
                  <label>Quel sera le capital de votre société ?</label>
                  <input type="text" placeholder="Montant en €" value={capitalAmount} onChange={(event) => setCapitalAmount(event.target.value)} />
                </div>
                <div className="field">
                  <label>Souhaitez-vous bénéficier des services de l'un de nos partenaires ?</label>
                  <div className="choice-group question-choices">
                    <button className={`choice-pill ${capitalPartner === "oui" ? "selected" : ""}`} onClick={() => setCapitalPartner("oui")}>
                      Oui
                    </button>
                    <button className={`choice-pill ${capitalPartner === "non" ? "selected" : ""}`} onClick={() => setCapitalPartner("non")}>
                      Non
                    </button>
                  </div>
                </div>
              </div>
              {capitalPartner === "non" && (
                <div className="subsection notice">Il vous sera demandé de fournir l'attestation de dépôt de capital.</div>
              )}
            </article>
          )}

          {capitalPartner && (
            <article className="form-card question-card" ref={stepFiscaliteRef}>
              <div className="question-step">Étape 8</div>
              <h3>Savez-vous quel régime fiscal vous souhaitez mettre en place pour votre société ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${fiscaliteKnown === "oui" ? "selected" : ""}`} onClick={() => setFiscaliteKnown("oui")}>
                  Oui
                </button>
                <button className={`choice-pill ${fiscaliteKnown === "non" ? "selected" : ""}`} onClick={() => setFiscaliteKnown("non")}>
                  Non
                </button>
              </div>
              {fiscaliteKnown === "oui" && (
                <div className="subsection field question-field-single">
                  <label>Précisez lequel</label>
                  <input type="text" placeholder="Régime fiscal souhaité" value={fiscaliteDetail} onChange={(event) => setFiscaliteDetail(event.target.value)} />
                </div>
              )}
              {fiscaliteKnown === "non" && (
                <div className="subsection">
                  <h3>Si non :</h3>
                  <div className="choice-group question-choices">
                    <button className={`choice-pill ${fiscaliteChoice === "Impôt sur les sociétés" ? "selected" : ""}`} onClick={() => setFiscaliteChoice("Impôt sur les sociétés")}>
                      Impôt sur les sociétés
                    </button>
                    <button className={`choice-pill ${fiscaliteChoice === "Impôt sur le revenu" ? "selected" : ""}`} onClick={() => setFiscaliteChoice("Impôt sur le revenu")}>
                      Impôt sur le revenu
                    </button>
                  </div>
                </div>
              )}
            </article>
          )}

          {(fiscaliteChoice || fiscaliteDetail) && (
            <article className="form-card question-card" ref={stepTvaRef} data-validation-step="9">
              <div className="question-step">Étape 9</div>
              <h3>Souhaitez-vous être en franchise de TVA ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${tva === "oui" ? "selected" : ""}`} onClick={() => setTva("oui")}>
                  Oui
                </button>
                <button className={`choice-pill ${tva === "non" ? "selected" : ""}`} onClick={() => setTva("non")}>
                  Non
                </button>
              </div>
              {tva === "oui" && (
                <div className="subsection field question-field-single">
                  <label>Merci de nous indiquer les raisons</label>
                  <textarea placeholder="Expliquez vos raisons" value={tvaReason} onChange={(event) => setTvaReason(event.target.value)} />
                </div>
              )}
              {validationErrors.step9 && <div className="subsection notice">{validationErrors.step9}</div>}
            </article>
          )}

          {tva && (
            <article className="form-card question-card" ref={stepParticularitesRef} data-validation-step="10">
              <div className="question-step">Étape 10</div>
              <h3>Avez-vous d'autres particularités sur la création de votre société ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${particularites === "oui" ? "selected" : ""}`} onClick={() => setParticularites("oui")}>
                  Oui
                </button>
                <button className={`choice-pill ${particularites === "non" ? "selected" : ""}`} onClick={() => setParticularites("non")}>
                  Non
                </button>
              </div>
              {particularites === "oui" && (
                <div className="subsection field question-field-single">
                  <label>Merci de nous les indiquer</label>
                  <textarea placeholder="Valeur des actions, nom commercial, durée de la société, autres dirigeants, modalités de fonctionnement..." value={particularitesDetail} onChange={(event) => setParticularitesDetail(event.target.value)} />
                </div>
              )}
              <div className="subsection notice">
                <strong>Exemples affichés en aide :</strong>
                <ul>
                  <li>valeur des actions</li>
                  <li>nom commercial</li>
                  <li>durée de la société</li>
                  <li>autres dirigeants</li>
                  <li>modalités de fonctionnement</li>
                  <li>régime réel ou simplifié</li>
                </ul>
              </div>
              {validationErrors.step10 && <div className="subsection notice">{validationErrors.step10}</div>}
            </article>
          )}

          {particularites && (
            <article className="form-card question-card" ref={stepImmatRef} data-validation-step="11">
              <div className="question-step">Étape 11</div>
              <h3>Souhaitez-vous bénéficier de nos services pour l'ensemble des démarches d'immatriculation ?</h3>
              <div className="choice-group question-choices">
                <button className={`choice-pill ${immatriculationService === "oui" ? "selected" : ""}`} onClick={() => setImmatriculationService("oui")}>
                  Oui
                </button>
                <button className={`choice-pill ${immatriculationService === "non" ? "selected" : ""}`} onClick={() => setImmatriculationService("non")}>
                  Non
                </button>
              </div>
              {validationErrors.step11 && <div className="subsection notice">{validationErrors.step11}</div>}
            </article>
          )}

          {immatriculationService && (
            <article className="form-card question-card result-card" data-validation-step="12">
              <div className="question-step">Étape 12 - Confirmation finale</div>
              <p>Toutes les informations nécessaires à votre création sont prêtes.</p>
              <p>Votre demande est enregistrée et transmise à notre équipe.</p>
              <p>Vos accès à l'espace client vous seront envoyés après validation de votre dossier par un conseiller.</p>
              <p>Dès réception de vos identifiants, vous pourrez vous connecter pour suivre la finalisation de votre création.</p>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Email de contact</label>
                  <input type="email" placeholder="vous@entreprise.fr" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} />
                </div>
                <div className="field">
                  <label>Téléphone</label>
                  <input type="tel" placeholder="06 00 00 00 00" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} />
                </div>
              </div>
              {validationErrors.step12 && <div className="subsection notice">{validationErrors.step12}</div>}
              <div className="inline-actions">
                <button className="btn btn-primary" type="button" onClick={handleLeadSubmit} disabled={isSubmittingLead || isValidatingLead || isLeadSubmitted}>
                  {isValidatingLead
                    ? "Vérification..."
                    : isSubmittingLead
                      ? "Enregistrement..."
                      : isLeadSubmitted
                        ? "Demande déjà enregistrée"
                        : "Valider et enregistrer ma demande"}
                </button>
                {isLeadSubmitted && (
                  <a className="btn btn-secondary" href="/espace-client">
                    Ouvrir l'espace client (après activation)
                  </a>
                )}
                <button className="btn btn-outline" type="button" onClick={handleDownloadRecap}>
                  Télécharger mon récapitulatif (PDF)
                </button>
              </div>
              {leadStatus && (
                <div className="subsection notice" style={isLeadSubmitted ? { color: "#b00020", fontWeight: 700 } : undefined}>
                  {leadStatus}
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}


