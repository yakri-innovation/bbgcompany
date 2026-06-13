document.querySelectorAll('[data-tab-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.dataset.tabGroup;
    const target = button.dataset.tabTarget;

    document.querySelectorAll(`[data-tab-group="${group}"] [data-tab-target]`).forEach((item) => {
      item.classList.remove('active');
    });

    document.querySelectorAll(`[data-tab-content="${group}"]`).forEach((panel) => {
      panel.classList.remove('active');
    });

    button.classList.add('active');
    const targetPanel = document.getElementById(target);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  });
});

const bindToggle = (selector, value, targetId) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('change', (event) => {
      const shouldShow = event.target.value === value;
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.toggle('hidden', !shouldShow);
      }
    });
  });
};

bindToggle('select[name="gestion-contact-rh"]', 'mail', 'gestion-rh-mail');
bindToggle('select[name="gestion-contact-rh"]', 'whatsapp', 'gestion-rh-whatsapp');
bindToggle('select[name="gestion-contact-compta"]', 'mail', 'gestion-compta-mail');
bindToggle('select[name="gestion-contact-compta"]', 'whatsapp', 'gestion-compta-whatsapp');
bindToggle('select[name="creation-siege"]', 'non', 'creation-siege-partenaire');
bindToggle('select[name="creation-fiscalite-known"]', 'oui', 'creation-fiscalite-precise');
bindToggle('select[name="creation-fiscalite-known"]', 'non', 'creation-fiscalite-options');
bindToggle('select[name="creation-tva"]', 'oui', 'creation-tva-raison');
bindToggle('select[name="creation-particularites"]', 'oui', 'creation-particularites-detail');
bindToggle('select[name="annonce-contact"]', 'mail', 'annonce-mail');
bindToggle('select[name="annonce-contact"]', 'whatsapp', 'annonce-whatsapp');
