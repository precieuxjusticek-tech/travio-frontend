/* =========================================================
   TRAVIO · Interface contrôleur — JS
   ⚠️ RIEN N'EST BRANCHÉ AU BACKEND ICI.
   Toutes les données ci-dessous sont des données de démo (mock)
   pour que la nav / les états / les écrans soient visibles.
   À remplacer plus tard par de vrais appels API (Firestore / server.js).
   ========================================================= */

(function () {
  "use strict";

    // ---------------------------------------------------------
    // 0) LOADER — masqué une fois l'app prête
    // ---------------------------------------------------------
    window.addEventListener("load", () => {
    const loader = document.getElementById("ctrlLoader");
    setTimeout(() => {
        loader.classList.add("ctrl-loader--hidden");
        setTimeout(() => (loader.style.display = "none"), 400);
    }, 5500); // laisse l'animation du contrôleur jouer un cycle complet
    });

  // ---------------------------------------------------------
  // 1) DONNÉES MOCK — à remplacer par un fetch vers ton backend
  // Un bus peut avoir plusieurs trajets dans la journée.
  // ---------------------------------------------------------
  const MOCK_BUS = { id: "B-204" };

  const MOCK_TRAJETS = [
    {
      id: "trj-1",
      heure: "07:30",
      depart: "Douala",
      arrivee: "Yaoundé",
      ticketsVendus: 42,
    },
    {
      id: "trj-2",
      heure: "11:00",
      depart: "Yaoundé",
      arrivee: "Bafoussam",
      ticketsVendus: 28,
    },
    {
      id: "trj-3",
      heure: "16:15",
      depart: "Bafoussam",
      arrivee: "Douala",
      ticketsVendus: 35,
    },
  ];

  // historique en mémoire, regroupé par trajetId : { [trajetId]: [ {code, passager, type, heure, statut} ] }
  const history = {};
  MOCK_TRAJETS.forEach((t) => (history[t.id] = []));

  // état de l'app
  let state = {
    activeTrajetId: null,
    currentMode: "scan", // "scan" | "manuel"
    historyPeriod: "today", // "today" | "week" | "all"
  };

  // ---------------------------------------------------------
  // 2) RÉFÉRENCES DOM
  // ---------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const busIdEl = $("#busId");
  const activeTrajetNameEl = $("#activeTrajetName");
  const trajetSwitcherBtn = $("#trajetSwitcher");

  const sheetTrajetListEl = $("#sheetTrajetList");
  const sheetOverlay = $("#sheetOverlay");

  const controleTrajetSubtitle = $("#controleTrajetSubtitle");
  const historiqueTrajetSubtitle = $("#historiqueTrajetSubtitle");

  const statValidated = $("#statValidated");
  const statSold = $("#statSold");

  const historyListEl = $("#historyList");
  const historyEmptyEl = $("#historyEmpty");
  const histFiltersEl = $$(".hist-filter-btn");

  const passengerSheetOverlay = $("#passengerSheetOverlay");
  const passengerSheetCode = $("#passengerSheetCode");
  const passengerListEl = $("#passengerList");

  const manualCodeInput = $("#manualCode");
  const btnSubmitManual = $("#btnSubmitManual");
  const btnSimulateScan = $("#btnSimulateScan");

  const stampOverlay = $("#stampOverlay");
  const stampMark = $("#stampMark");
  const stampText = $("#stampText");
  const stampCode = $("#stampCode");
  const stampPassenger = $("#stampPassenger");
  const stampType = $("#stampType");
  const stampTrajet = $("#stampTrajet");
  const stampClose = $("#stampClose");

  // ---------------------------------------------------------
  // 3) INIT
  // ---------------------------------------------------------
  busIdEl.textContent = MOCK_BUS.id;
  renderSheetTrajetList();
  updateActiveTrajetUI();
  if (!state.activeTrajetId) openSheet();

  // ---------------------------------------------------------
  // 4) NAVIGATION ENTRE VUES (Trajets / Contrôle / Historique)
  // ---------------------------------------------------------
  const navButtons = $$(".nav__btn");
  const views = $$(".view");

  function goToView(target) {
    views.forEach((v) => v.classList.toggle("view--active", v.dataset.view === target));
    navButtons.forEach((b) => b.classList.toggle("nav__btn--active", b.dataset.target === target));

    if (target === "historique") renderHistory();
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => goToView(btn.dataset.target));
  });

  // ---------------------------------------------------------
  // 5) LISTE DES TRAJETS + SÉLECTION DU TRAJET ACTIF
  // ---------------------------------------------------------
  function trajetCardHTML(t, isActive) {
    return `
      <button class="trajet-card ${isActive ? "trajet-card--active" : ""}" data-trajet-id="${t.id}" type="button">
        <div class="trajet-card__time">
          <span class="trajet-card__time-h">${t.heure}</span>
          <span class="trajet-card__time-l">Départ</span>
        </div>
        <div class="trajet-card__body">
          <div class="trajet-card__route">${t.depart} → ${t.arrivee}</div>
          <div class="trajet-card__meta">${t.ticketsVendus} billets vendus · ${history[t.id].length} contrôlés</div>
        </div>
        <span class="trajet-card__badge">${isActive ? "Actif" : "Choisir"}</span>
      </button>
    `;
  }

  function renderSheetTrajetList() {
    sheetTrajetListEl.innerHTML = MOCK_TRAJETS.map((t) =>
      trajetCardHTML(t, t.id === state.activeTrajetId)
    ).join("");

    $$(".trajet-card", sheetTrajetListEl).forEach((card) =>
      card.addEventListener("click", () => {
        selectTrajet(card.dataset.trajetId, false);
        closeSheet();
      })
    );
  }

  function selectTrajet(trajetId, switchToControleView) {
    state.activeTrajetId = trajetId;
    updateActiveTrajetUI();
    renderSheetTrajetList();
    if (switchToControleView) goToView("controle");
  }

  function getActiveTrajet() {
    return MOCK_TRAJETS.find((t) => t.id === state.activeTrajetId) || null;
  }

  function updateActiveTrajetUI() {
    const t = getActiveTrajet();

    if (!t) {
      activeTrajetNameEl.textContent = "Aucun trajet sélectionné";
      controleTrajetSubtitle.textContent = "Sélectionne d'abord un trajet";
      historiqueTrajetSubtitle.textContent = "Sélectionne un trajet pour voir son historique";
      statSold.textContent = "—";
      statValidated.textContent = "0";
      return;
    }

    activeTrajetNameEl.textContent = `${t.depart} → ${t.arrivee} · ${t.heure}`;
    controleTrajetSubtitle.textContent = `${t.depart} → ${t.arrivee} · ${t.heure}`;
    historiqueTrajetSubtitle.textContent = `${t.depart} → ${t.arrivee} · ${t.heure}`;
    statSold.textContent = t.ticketsVendus;
    statValidated.textContent = history[t.id].filter((h) => h.statut === "valide").length;
  }

  // ---------------------------------------------------------
  // 6) FEUILLE (bottom sheet) POUR CHANGER DE TRAJET DEPUIS LA TOPBAR
  // ---------------------------------------------------------
  function openSheet() {
    sheetOverlay.classList.add("sheet-overlay--visible");
  }
  function closeSheet() {
    sheetOverlay.classList.remove("sheet-overlay--visible");
  }

  trajetSwitcherBtn.addEventListener("click", openSheet);
  sheetOverlay.addEventListener("click", (e) => {
    if (e.target === sheetOverlay) closeSheet();
  });

  // ---------------------------------------------------------
  // 7) BASCULE SCANNER / SAISIE MANUELLE
  // ---------------------------------------------------------
  const modeButtons = $$(".mode-toggle__btn");
  const panels = { scan: $("#panel-scan"), manuel: $("#panel-manuel") };

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentMode = btn.dataset.mode;
      modeButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("mode-toggle__btn--active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      Object.entries(panels).forEach(([mode, panel]) =>
        panel.classList.toggle("mode-panel--active", mode === state.currentMode)
      );
    });
  });

  // ---------------------------------------------------------
  // 8) SIMULATION DE CONTRÔLE (scan ou saisie)
  //    ⚠️ Ici on tire un résultat au hasard, juste pour montrer
  //    les 2 états visuels (validé / refusé).
  //    Le vrai code doit interroger le backend avec le code du billet
  //    + vérifier qu'il correspond bien au trajet actif.
  // ---------------------------------------------------------
  function fakeLookupTicket(code) {
    const noms = ["A. Nguemo", "S. Fotso", "R. Talla", "M. Ateba", "J. Mballa", "C. Ondoa", "L. Biya"];
    const types = ["Plein tarif", "Étudiant", "Enfant (-12 ans)", "Senior"];
    const estValide = Math.random() > 0.25;

    const nbPassagers = Math.random() > 0.6 ? Math.floor(2 + Math.random() * 2) : 1;
    const passagers = Array.from({ length: nbPassagers }, () => ({
      nom: noms[Math.floor(Math.random() * noms.length)],
      type: types[Math.floor(Math.random() * types.length)],
    }));

    return {
      code: code || `TRV-${Math.floor(1000 + Math.random() * 9000)}-XF`,
      passager: passagers[0].nom,
      type: passagers[0].type,
      passagers,
      statut: estValide ? "valide" : "refuse",
    };
  }

  function processTicket(code) {
    const t = getActiveTrajet();
    if (!t) {
      alert("Sélectionne un trajet avant de contrôler un billet.");
      return;
    }

    const result = fakeLookupTicket(code);

    // on ajoute à l'historique du trajet actif
    history[t.id].unshift({
      ...result,
      heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      dateJour: new Date().toISOString().slice(0, 10),
    });

    showStamp(result, t);
    updateActiveTrajetUI();
  }

  btnSimulateScan.addEventListener("click", () => processTicket(null));

  btnSubmitManual.addEventListener("click", () => {
    const code = manualCodeInput.value.trim();
    if (!code) {
      manualCodeInput.focus();
      return;
    }
    processTicket(code);
    manualCodeInput.value = "";
  });

  manualCodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnSubmitManual.click();
  });

  // ---------------------------------------------------------
  // 9) MODALE "TAMPON" DE RÉSULTAT
  // ---------------------------------------------------------
  function showStamp(result, trajet) {
    const isValide = result.statut === "valide";

    stampText.textContent = isValide ? "VALIDÉ" : "REFUSÉ";
    stampMark.classList.toggle("stamp-mark--rejected", !isValide);

    stampCode.textContent = result.code;
    stampPassenger.textContent = result.passager;
    stampType.textContent = result.type;
    stampTrajet.textContent = `${trajet.depart} → ${trajet.arrivee}`;

    stampOverlay.classList.add("stamp-overlay--visible");
  }

  function closeStamp() {
    stampOverlay.classList.remove("stamp-overlay--visible");
  }

  stampClose.addEventListener("click", closeStamp);
  stampOverlay.addEventListener("click", (e) => {
    if (e.target === stampOverlay) closeStamp();
  });

  // ---------------------------------------------------------
  // 10) HISTORIQUE
  // ---------------------------------------------------------
  function filterByPeriod(items) {
    if (state.historyPeriod === "all") return items;

    const today = new Date().toISOString().slice(0, 10);
    if (state.historyPeriod === "today") {
      return items.filter((h) => h.dateJour === today);
    }
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return items.filter((h) => h.dateJour >= weekAgo);
  }

  function renderHistory() {
    const t = getActiveTrajet();
    const allItems = t ? history[t.id] : [];
    const items = filterByPeriod(allItems);

    if (!items.length) {
      historyListEl.innerHTML = "";
      historyEmptyEl.classList.add("empty-state--visible");
      return;
    }

    historyEmptyEl.classList.remove("empty-state--visible");
    historyListEl.innerHTML = items
      .map((h) => {
        const nb = h.passagers ? h.passagers.length : 1;
        const multiBadge = nb > 1 ? `<span class="history-item__multi">${nb} passagers</span>` : "";
        return `
        <div class="history-item" data-index="${allItems.indexOf(h)}">
          <span class="history-item__status ${h.statut !== "valide" ? "history-item__status--rejected" : ""}"></span>
          <div class="history-item__body">
            <div class="history-item__code">${h.code}</div>
            <div class="history-item__meta">${h.passager} · ${h.type}</div>
          </div>
          ${multiBadge}
          <span class="history-item__time">${h.heure}</span>
        </div>
      `;
      })
      .join("");

    $$(".history-item", historyListEl).forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.dataset.index);
        openPassengerSheet(allItems[idx]);
      });
    });
  }

  function openPassengerSheet(entry) {
    passengerSheetCode.textContent = entry.code;
    const passagers = entry.passagers || [{ nom: entry.passager, type: entry.type }];

    passengerListEl.innerHTML = passagers
      .map(
        (p) => `
        <div class="passenger-item">
          <div>
            <div class="passenger-item__name">${p.nom}</div>
            <div class="passenger-item__type">${p.type}</div>
          </div>
          <span class="passenger-item__status ${entry.statut !== "valide" ? "passenger-item__status--rejected" : ""}">${entry.statut === "valide" ? "Validé" : "Refusé"}</span>
        </div>
      `
      )
      .join("");

    passengerSheetOverlay.classList.add("sheet-overlay--visible");
  }

  function closePassengerSheet() {
    passengerSheetOverlay.classList.remove("sheet-overlay--visible");
  }

  passengerSheetOverlay.addEventListener("click", (e) => {
    if (e.target === passengerSheetOverlay) closePassengerSheet();
  });

  histFiltersEl.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.historyPeriod = btn.dataset.period;
      histFiltersEl.forEach((b) => b.classList.toggle("hist-filter-btn--active", b === btn));
      renderHistory();
    });
  });

})();