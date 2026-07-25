// ─── TRAVIO — Mode d'emploi ───
import { agenceData } from './state.js';

const ICONS_GUIDE = {
  chevron: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="guide-chevron"><path d="M4 5.5L7 8.5L10 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  overview:   '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.6"/></svg>',
  reservations: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="13" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 1v4M13 1v4M1 7h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  trajets: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="13" r="2.5" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="13" r="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M2 13V6a2 2 0 012-2h6l4 4v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  finances: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M1 8h16" stroke="currentColor" stroke-width="1.6"/></svg>',
  equipe: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M1 16a6 6 0 0112 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  billets: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 4V2h6v2M6 8h6M6 11h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  agence: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.6"/><path d="M9 6v3l2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  abonnement: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  vente: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 5V4a3 3 0 016 0v1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 10v2M7 11h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  monpdv: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M6 9h6M6 12h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 6h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

// ════════════════════════════════
//  GUIDE SIÈGE
// ════════════════════════════════
const GUIDE_SECTIONS = [
  { id: 'overview',     icon: ICONS_GUIDE.overview,     title: 'Vue d\'ensemble',           subtitle: 'Vos stats du jour en un coup d\'œil', content: `
    <p>La Vue d'ensemble vous donne un résumé rapide de l'activité <strong>du jour même</strong>. C'est la première page que vous voyez en vous connectant.</p>

    <p><strong>Les 4 cartes en haut :</strong></p>
    <ul>
        <li><strong>Réservations aujourd'hui</strong> — nombre de réservations créées aujourd'hui (les annulées ne sont pas comptées).</li>
        <li><strong>Revenus du jour</strong> — total encaissé sur ces réservations du jour.</li>
        <li><strong>Trajets actifs</strong> — nombre total de trajets actuellement activés dans votre agence, peu importe la date.</li>
        <li><strong>Billets vendus aujourd'hui</strong> — nombre total de passagers inclus dans les réservations créées aujourd'hui.</li>
    </ul>

    <p><strong>Important :</strong> ces chiffres se basent sur la date à laquelle la réservation a été <em>créée</em> (achetée), pas sur la date du voyage. Une réservation faite aujourd'hui pour un voyage la semaine prochaine compte bien dans les stats "aujourd'hui".</p>

    <p><strong>Dernières réservations</strong> — affiche les 5 réservations confirmées les plus récentes. Celles créées aujourd'hui sont mises en avant avec un point vert et l'étiquette "Aujourd'hui". Vous verrez aussi des alertes directement dessus si un prix a été réduit lors d'une modification ou si un passager a été retiré.</p>

    <p><strong>Actions rapides</strong> — raccourcis pour ajouter un trajet, ajouter un PDV, ou modifier la fiche de votre agence, sans passer par le menu.</p>

    <div class="guide-warning-box">⚠️ Cliquer sur une réservation dans la liste ouvre directement son détail — pas besoin d'aller dans "Réservations" pour ça.</div>` 
  },
  { id: 'reservations', icon: ICONS_GUIDE.reservations, title: 'Réservations',              subtitle: 'Suivre et gérer les réservations',     content: `
    <p>Cette page regroupe <strong>toutes les réservations</strong> de votre réseau (tous PDV confondus), avec des filtres pour retrouver rapidement ce que vous cherchez.</p>

    <p><strong>Filtrer par période :</strong></p>
    <ul>
        <li><strong>Aujourd'hui / Semaine / Mois / Tout</strong> — filtre rapide sur la date de <em>création</em> de la réservation (pas la date du voyage).</li>
        <li><strong>Période précise</strong> — permet de choisir une plage de dates personnalisée (utile pour un rapport mensuel exact ou une seule journée).</li>
    </ul>

    <p><strong>Filtrer par critère :</strong> ville, PDV, trajet, bus ou statut (confirmée, annulée, avec retrait passager, réaffectée). Les filtres sont en cascade : sélectionner une ville réduit automatiquement la liste des PDV et trajets proposés ensuite.</p>

    <p><strong>Les statistiques affichées</strong> se recalculent selon la période et les filtres actifs :</p>
    <ul>
        <li><strong>Réservations</strong> — total sur la période, dont le nombre d'annulées.</li>
        <li><strong>Taux d'annulation</strong> — pourcentage de réservations annulées.</li>
        <li><strong>PDV vendeurs actifs</strong> — combien de vos PDV ont vendu au moins un billet sur la période.</li>
        <li><strong>Modifications à la baisse</strong> — réservations dont le prix a été réduit lors d'une modification et qui n'ont pas encore été vérifiées par vous.</li>
        <li><strong>Billets vendus</strong> — nombre total de passagers.</li>
        <li><strong>Passagers déjà transportés</strong> — parmi les billets vendus, ceux dont le voyage a déjà eu lieu.</li>
        <li><strong>Passagers retirés</strong> — retraits individuels sur des billets à plusieurs passagers.</li>
        <li><strong>Réservations réaffectées</strong> — déplacées automatiquement suite à un changement ou une suppression de bus.</li>
    </ul>

    <p><strong>Les alertes automatiques</strong> apparaissent en haut de page : PDV inactifs depuis 5 jours ou plus, trajets sous-performants (moins de 5 billets vendus en 7 jours), annulations récentes, et modifications à la baisse à vérifier. Cliquer sur une alerte ouvre la liste concernée.</p>

    <p><strong>Cliquer sur une réservation</strong> ouvre son détail complet : infos du trajet, informations passager(s), billet de contrôle (code ou QR), et les actions disponibles.</p>

    <div class="guide-warning-box">⚠️ Une réservation ne peut être modifiée qu'<strong>une seule fois</strong>. Si le nouveau prix est inférieur à l'ancien, une raison est obligatoire — la réservation sera marquée "à vérifier" jusqu'à ce que vous la confirmiez.</div>

    <p><strong>Annulation</strong> — le remboursement dépend de la politique d'annulation définie dans "Mon agence" (vente définitive, sans remboursement, ou avec remboursement selon un délai et un pourcentage de frais retenus). Pour un billet à plusieurs passagers, vous pouvez retirer un seul passager sans annuler tout le billet.</p>

    <p><strong>Imprimer / Rapport Travio</strong> — génère un document PDF avec les réservations filtrées, à imprimer ou à archiver.</p>`
  },
  { id: 'trajets',      icon: ICONS_GUIDE.trajets,      title: 'Trajets & Bus',             subtitle: 'Créer vos lignes et votre flotte',     content: `
    <div class="guide-warning-box">⚠️ <strong>Impossible de créer un trajet sans avoir créé au moins un PDV au préalable.</strong> Un trajet a besoin d'au moins un PDV de départ et un PDV d'arrivée pour être créé — pensez donc à créer vos points de vente (page "Équipe & PDV") avant de configurer vos trajets.</div>

    <p>Cette page a deux onglets : <strong>Trajets</strong> (vos lignes) et <strong>Flotte de bus</strong> (vos véhicules).</p>

    <p><strong>Avant de créer un trajet</strong>, configurez vos "Types de billets" (bouton en haut de la page) — par exemple Adulte / Enfant, avec des tranches d'âge. Ces types serviront à définir les prix sur tous vos trajets. Vous pouvez en avoir jusqu'à 3.</p>

    <p><strong>Créer un trajet se fait en 2 étapes :</strong></p>
    <ul>
        <li><strong>Étape 1</strong> — ville de départ, ville d'arrivée, type de trajet (Direct ou Avec arrêts), et les PDV autorisés à vendre au départ et à l'arrivée. Pour un trajet "Avec arrêts", vous ajoutez chaque ville intermédiaire, ses PDV, l'heure de passage estimée, et son propre prix par type de billet.</li>
        <li><strong>Étape 2</strong> — le prix pour chaque type de billet, plus en option la limite de bagages (kg) et les frais par kg en cas d'excédent.</li>
    </ul>

    <p><strong>Direct vs Avec arrêts :</strong> un trajet direct n'a qu'un seul prix par type de billet (du départ à l'arrivée). Un trajet avec arrêts calcule un <strong>prix par tronçon</strong> — chaque combinaison de deux points (ex: Ville A → Ville C) a son propre prix, généré automatiquement dans un tableau que vous remplissez.</p>

    <p><strong>Une fois le trajet créé</strong>, Travio vous invite directement à ajouter un bus dessus — un trajet sans bus ne peut pas générer de sessions vendables.</p>

    <p><strong>Ajouter un bus (onglet "Bus" dans le détail d'un trajet) :</strong></p>
    <ul>
        <li>Vous choisissez un véhicule déjà présent dans votre <strong>Flotte de bus</strong>. S'il n'y en a pas encore, un lien permet d'en créer un directement.</li>
        <li>Un même véhicule ne peut pas être ajouté deux fois sur le même trajet.</li>
        <li>Heure de départ (obligatoire), heure d'arrivée (optionnelle, la durée se calcule automatiquement), et les jours de circulation.</li>
        <li>Pour un trajet avec arrêts, vous choisissez quels arrêts ce bus dessert précisément.</li>
    </ul>

    <p><strong>Les sessions</strong> sont les départs concrets générés jour par jour (jusqu'à 14 jours à l'avance) à partir de la configuration du bus. C'est sur une session que les PDV vendent réellement des billets. Vous pouvez modifier une session ponctuellement (heure, arrêts actifs ce jour-là) ou <strong>signaler un incident</strong> (panne, chauffeur absent, accident...) pour l'annuler — ses réservations devront alors être réaffectées ou remboursées.</p>

    <div class="guide-warning-box">⚠️ Supprimer ou désactiver un trajet, un bus, ou un véhicule qui a des réservations en cours vous demandera de les <strong>réaffecter vers un autre bus</strong> ou de les <strong>annuler</strong> avant de pouvoir continuer.</div>

    <p><strong>Flotte de bus</strong> — vos véhicules existent indépendamment des trajets. Un même véhicule peut être utilisé sur plusieurs trajets à la fois. Modifier son nom, type ou capacité se répercute automatiquement partout où il est utilisé. Si vous désactivez ou supprimez un véhicule, Travio vous demande si l'action doit s'appliquer <strong>uniquement sur ce trajet</strong> ou <strong>sur tous les trajets</strong> où il circule.</p>`
  },
  { id: 'finances',     icon: ICONS_GUIDE.finances,     title: 'Finances',                  subtitle: 'Revenus, ventes et performance',       content: `
    <p>Cette page analyse vos revenus et vos ventes. Par défaut elle affiche <strong>la semaine en cours</strong>, mais vous pouvez basculer sur Aujourd'hui, Mois, Tout, ou une période précise.</p>

    <p><strong>Les filtres avancés</strong> (ville, PDV, trajet, bus, statut, avec/sans retrait passager) fonctionnent en cascade comme sur la page Réservations, et s'appliquent à toute la page, y compris les graphiques.</p>

    <p><strong>Les KPIs principaux</strong> comparent toujours la période choisie à la <strong>période équivalente précédente</strong> (ex: cette semaine vs la semaine dernière) pour voir si vous progressez :</p>
    <ul>
        <li><strong>Ce que vous avez encaissé</strong> — chiffre d'affaires réel sur les réservations confirmées.</li>
        <li><strong>Billets vendus</strong>, <strong>Prix moyen par billet</strong>, <strong>Taux d'annulation</strong>, <strong>Réservations</strong>.</li>
        <li><strong>Passagers déjà transportés</strong> — parmi les billets vendus sur la période, ceux dont le départ est déjà passé.</li>
        <li><strong>Passagers retirés</strong> — retraits individuels sur des billets à plusieurs passagers.</li>
    </ul>

    <p><strong>Impact sur vos revenus</strong> — ce bloc chiffre précisément ce que vous perdez ou récupérez : montant des annulations, montant des modifications à la baisse, montant des retraits de passagers, et les frais que vous avez pu retenir dessus (selon votre politique d'annulation). Un total "revenu net perdu" et un total "récupéré en frais" vous donnent une vue claire.</p>

    <p><strong>Ventes jour par jour</strong> — graphique qui s'adapte à la période : par heure si "Aujourd'hui", par jour si "Semaine", par semaine si "Mois", par mois si "Tout". Cliquer sur une barre (jour) ouvre le détail des ventes de ce jour précis.</p>

    <p><strong>Quel jour vend-on le plus ?</strong> — répartition de vos revenus par jour de la semaine, sur toute la période sélectionnée, pour repérer vos pics d'activité et mieux planifier vos bus.</p>

    <p><strong>Ventes par point de vente</strong> et <strong>Trajets les plus rentables</strong> — classements du plus au moins rentable, groupés par ville pour les PDV. Cliquer sur un PDV ouvre son détail avec son taux de remplissage par trajet et par bus ; cliquer sur un trajet ouvre son détail avec le remplissage réel par bus et la répartition par PDV vendeur.</p>

    <p><strong>Imprimer / Rapport Travio</strong> — génère un PDF complet reprenant tous ces chiffres pour la période et les filtres actifs, pratique pour un suivi mensuel ou une réunion.</p>`
  },
  { id: 'equipe',       icon: ICONS_GUIDE.equipe,       title: 'Équipe & PDV',              subtitle: 'Gérer vos points de vente',            content: `
    <p>Cette page liste tous vos <strong>points de vente (PDV)</strong>, regroupés par ville. Chaque PDV correspond à un accès agent (email + mot de passe) qui permet à un vendeur de faire des réservations sur les trajets qui lui sont assignés.</p>

    <p><strong>La barre de stats en haut</strong> donne une vue rapide :</p>
    <ul>
        <li><strong>PDV actifs</strong> — sur le total de vos PDV créés.</li>
        <li><strong>À surveiller</strong> — PDV actifs qui n'ont fait aucune vente depuis 5 jours ou plus. Cliquer dessus filtre directement la liste sur ces PDV.</li>
        <li><strong>Revenu réseau (mois)</strong> — somme des revenus du mois en cours sur tous vos PDV.</li>
    </ul>

    <p><strong>Chaque carte PDV</strong> affiche le responsable, le téléphone, le nombre de trajets assignés, la date de la dernière vente, ainsi que 3 indicateurs du mois en cours : billets vendus, taux de vente, et revenu généré. Si une ville compte plus de 4 PDV, seuls les 4 premiers s'affichent avec un lien "Voir tout →".</p>

    <p><strong>Cliquer sur une carte</strong> ouvre le détail du PDV avec deux onglets :</p>
    <ul>
        <li><strong>Infos</strong> — coordonnées (responsable, téléphone, adresse, email personnel) et accès agent (email de connexion, mot de passe visible via l'icône œil). C'est ici que se trouvent les actions : modifier les infos, réinitialiser le mot de passe, activer/désactiver, ou supprimer le PDV.</li>
        <li><strong>Trajets</strong> — liste des trajets sur lesquels ce PDV est autorisé à vendre, avec le rôle (point de départ ou arrêt intermédiaire), le nombre de bus actifs et les jours de circulation.</li>
    </ul>

    <p><strong>Créer un PDV se fait en 2 étapes :</strong></p>
    <ul>
        <li><strong>Étape 1</strong> — ville, nom du point de vente, adresse/quartier, téléphone du responsable.</li>
        <li><strong>Étape 2</strong> — nom du responsable, email personnel (optionnel), email de connexion et mot de passe (6 caractères minimum) pour l'accès agent.</li>
    </ul>

    <div class="guide-warning-box">⚠️ <strong>Désactiver</strong> un PDV empêche l'agent de se connecter, mais ses réservations existantes restent valables. <strong>Supprimer</strong> un PDV est en revanche irréversible : le compte de l'agent est supprimé définitivement avec lui.</div>

    <p><strong>Réinitialiser le mot de passe</strong> — pratique si l'agent l'a oublié ou pour renouveler l'accès ; le nouveau mot de passe est actif immédiatement, sans notification automatique à l'agent — pensez à le lui transmettre vous-même.</p>
    <p>Cette page contient également un onglet <strong>Contrôleurs</strong>, pour la gestion des accès de vos agents à bord des bus. Cette fonctionnalité est en cours de développement et arrivera prochainement.</p>` 
  },
  { id: 'billets',      icon: ICONS_GUIDE.billets,      title: 'Configuration des billets', subtitle: 'Comment vos billets sont générés',     content: `
    <p>Cette page vous permet de définir <strong>comment vos billets sont remis aux passagers</strong>. Tant qu'elle n'est pas configurée, un badge d'alerte reste affiché dans le menu.</p>

    <p><strong>Trois modes disponibles :</strong></p>
    <ul>
        <li><strong>Imprimante A4 / A5</strong> — billet complet imprimé sur feuille avec toutes les infos du voyage.</li>
        <li><strong>Imprimante thermique 80mm</strong> — reçu compact façon ticket de caisse.</li>
        <li><strong>Aucune impression (manuel)</strong> — aucun billet généré ; l'agent voit un écran récapitulatif et recopie les informations sur un carnet papier.</li>
    </ul>

    <p>Pour les modes <strong>A4/A5</strong> et <strong>thermique</strong>, une deuxième étape vous demande de choisir un design : <strong>Sobre</strong> (noir & blanc, professionnel) ou <strong>Coloré</strong> (dégradé teal/bleu, plus visuel). Un aperçu du billet final s'affiche en direct, avec les informations de votre agence (logo, nom, slogan).</p>

    <p>Le billet généré reprend automatiquement : trajet, date, heure de départ, bus/siège, nombre de voyageurs, points d'embarquement/débarquement, prix, agent vendeur, ainsi que votre politique d'annulation et le délai de présentation avant le départ si vous les avez renseignés dans "Mon agence".</p>

    <div class="guide-warning-box">⚠️ Le <strong>code alphanumérique de contrôle</strong> n'est pas encore actif — il sera ajouté automatiquement à vos billets dès que la fonctionnalité sera prête, sans action de votre part.</div>

    <p>Une fois la configuration enregistrée, chaque impression de billet (depuis le détail d'une réservation) utilise automatiquement le mode et le design choisis. En mode manuel, l'agent peut copier les informations en un clic pour les recopier facilement.</p>` 
  },
  { id: 'agence',       icon: ICONS_GUIDE.agence,       title: 'Mon agence',                subtitle: 'Fiche, présentation, politique',       content: `
    <p>Cette page affiche la <strong>fiche publique de votre agence</strong> : logo, photos, description, histoire, points forts, engagements, règles et politique d'annulation.</p>

    <p><strong>Modifier l'agence</strong> propose deux choix distincts :</p>
    <ul>
        <li><strong>Modifier la fiche</strong> — nom, slogan, description, histoire, ville, adresse, téléphone, année de création, les 3 points "Pourquoi nous choisir", vos engagements et vos règles.</li>
        <li><strong>Gérer les images</strong> — changer le logo et gérer jusqu'à 5 photos de présentation (ajout et suppression indépendants, sauvegardés ensemble).</li>
    </ul>

    <p><strong>Politique d'annulation</strong> — 3 options possibles :</p>
    <ul>
        <li><strong>Avec remboursement</strong> — vous choisissez un délai minimum avant le départ (1h à 48h) et un pourcentage de frais retenus.</li>
        <li><strong>Sans remboursement</strong> — annulation autorisée mais aucune somme rendue, avec le même délai minimum.</li>
        <li><strong>Vente définitive</strong> — aucune annulation possible.</li>
    </ul>
    <p>Cette politique s'applique automatiquement à toutes les annulations faites depuis "Réservations", et s'affiche sur les billets imprimés.</p>

    <p><strong>Délai de présentation avant le départ</strong> — un délai (en minutes ou en heures) que vous demandez aux passagers de respecter pour se présenter avant l'heure de départ. Il s'affiche aussi sur le billet si renseigné.</p>

    <div class="guide-warning-box">⚠️ Le téléphone de l'agence doit contenir exactement <strong>9 chiffres</strong> — la saisie est automatiquement limitée à ce format.</div>` 
  },
  { id: 'abonnement',   icon: ICONS_GUIDE.abonnement,   title: 'Mon essai gratuit',         subtitle: 'Comment fonctionne la période d\'essai', content: `
    <p>À la création de votre agence, vous bénéficiez automatiquement d'un <strong>essai gratuit de 12 jours</strong> avec accès complet à toutes les fonctionnalités de Travio.</p>

    <p><strong>Cette page affiche :</strong></p>
    <ul>
        <li>Le statut de votre essai (Actif ou Terminé).</li>
        <li>La date exacte de fin d'essai.</li>
        <li>Le nombre de jours restants.</li>
    </ul>

    <p><strong>Rappels automatiques :</strong> à partir de <strong>5 jours ou moins</strong> avant la fin de l'essai, un badge d'alerte apparaît dans le menu et une bulle de rappel s'affiche en bas de l'écran (avec les coordonnées de contact), avec une couleur qui s'intensifie à mesure que l'échéance approche : bleu (4-5 jours), orange (2-3 jours), puis rouge (0-1 jour).</p>

    <div class="guide-warning-box">⚠️ Une fois l'essai terminé, l'accès au dashboard est <strong>bloqué</strong> — un écran vous invite à contacter l'équipe Travio au <strong>064 98 85 61 / 044 58 17 11</strong> pour continuer à utiliser la plateforme.</div>

    <p>Pour prolonger ou activer un abonnement payant, contactez directement l'équipe Travio par téléphone — cette page ne gère pas encore le paiement en ligne.</p>` 
  },
];

// ════════════════════════════════
//  GUIDE PDV
// ════════════════════════════════
const GUIDE_SECTIONS_PDV = [
  { id: 'pdv-accueil', icon: ICONS_GUIDE.overview, title: 'Accueil',            subtitle: 'Votre activité du jour', content: `
    <p>La page d'accueil de l'espace PDV affiche un résumé de votre activité, propre à <strong>votre point de vente uniquement</strong> (pas les autres PDV de l'agence).</p>

    <p><strong>Les 4 cartes en haut :</strong></p>
    <ul>
        <li><strong>Réservations aujourd'hui</strong> — total des réservations créées aujourd'hui par votre PDV.</li>
        <li><strong>Vendus aujourd'hui</strong> — nombre de billets (passagers) vendus aujourd'hui.</li>
        <li><strong>Vendus ce mois</strong> — total de billets vendus depuis le début du mois.</li>
        <li><strong>Revenus du jour</strong> — montant encaissé aujourd'hui par votre PDV.</li>
    </ul>

    <p><strong>Dernières ventes</strong> — les 5 réservations confirmées les plus récentes de votre PDV, avec un repère visuel pour celles faites aujourd'hui. Cliquer dessus ouvre le détail complet.</p>

    <p><strong>Accès rapide</strong> — raccourci vers vos trajets assignés pour lancer une vente directement, sans passer par le menu "Trajets disponibles".</p>

    <p>Le bouton <strong>"Vendre un billet"</strong> en haut de page vous amène directement à l'écran de vente.</p>` 
  },
  { id: 'pdv-vente', icon: ICONS_GUIDE.vente, title: 'Vente de billets', subtitle: 'Vendre un billet en 2 étapes', content: `
    <p>C'est l'écran principal de l'agent : vendre un billet à un passager, en <strong>2 étapes</strong>.</p>

    <p><strong>Étape 1 — Choisir le trajet :</strong></p>
    <ul>
        <li>Basculez entre <strong>Direct</strong> et <strong>Avec arrêts</strong> selon le type de trajet recherché.</li>
        <li>Utilisez la barre de recherche ou cliquez directement sur une carte de trajet dans la liste.</li>
        <li>Pour un trajet <strong>direct</strong> : le récapitulatif affiche la route, les prix par type de billet, et vous choisissez le PDV d'embarquement (pré-rempli sur votre PDV) et le PDV de débarquement.</li>
        <li>Pour un trajet <strong>avec arrêts</strong> : une timeline affiche tous les points du trajet. Vous choisissez la ville de montée (limitée à votre position sur la ligne) et la ville de descente parmi les arrêts suivants — le prix du segment se calcule automatiquement.</li>
        <li>Sélectionnez ensuite une <strong>session de départ</strong> disponible (date + bus + places restantes). Une session complète ou dont l'heure est déjà passée ne peut pas être sélectionnée.</li>
    </ul>

    <p><strong>Étape 2 — Informations passager(s) :</strong></p>
    <ul>
        <li>Le passager principal est obligatoire (prénom, nom, téléphone, type de billet). Vous pouvez <strong>ajouter d'autres passagers</strong> sur la même réservation avec le bouton dédié — seuls prénom, nom et type sont requis pour eux.</li>
        <li>Bagages et siège sont optionnels, repliés sous "Bagages, siège (facultatif)". Un excédent de bagages au-delà de la limite du trajet ajoute des frais automatiquement au prix.</li>
        <li>Le <strong>prix estimé</strong> se met à jour en direct en bas de l'écran à chaque changement.</li>
    </ul>

    <p>Un <strong>récapitulatif</strong> s'affiche avant la confirmation finale — vérifiez tout avant de valider, car la vente n'est pas annulable immédiatement après (une politique d'annulation s'applique).</p>

    <p>Une fois la vente confirmée, le <strong>billet s'affiche</strong> automatiquement selon le mode configuré par votre agence (voir plus bas) : à imprimer, ou à recopier manuellement.</p>` 
  },
  { id: 'pdv-reservations', icon: ICONS_GUIDE.reservations, title: 'Mes réservations', subtitle: 'Historique de vos ventes', content: `
    <p>Cette page liste <strong>uniquement les réservations faites par votre PDV</strong> — pas celles des autres points de vente de l'agence.</p>

    <p><strong>Filtres période :</strong> Aujourd'hui, Cette semaine, Ce mois, Tout, ou une période précise avec un sélecteur de dates.</p>

    <p><strong>Filtres complémentaires :</strong> recherche par nom/téléphone du passager, trajet, bus, statut (confirmées, annulées, avec retrait, réaffectées), et tri (date ou prix, croissant/décroissant).</p>

    <p><strong>Mini-statistiques</strong> sur la sélection filtrée : billets vendus, montant encaissé, nombre de réservations, réservations réaffectées.</p>

    <p><strong>Cliquer sur une réservation</strong> ouvre le détail complet avec toutes les informations du trajet, des passagers, et le <strong>billet de contrôle</strong> (code alphanumérique ou QR code, à venir).</p>

    <p><strong>Actions disponibles sur une réservation active :</strong></p>
    <ul>
        <li><strong>Modifier</strong> — une seule fois par réservation. Si le nouveau prix est inférieur, une raison doit être précisée.</li>
        <li><strong>Annuler</strong> — le remboursement suit la politique d'annulation de l'agence. Pour un billet à plusieurs passagers, vous pouvez retirer un seul passager sans annuler tout le billet.</li>
    </ul>

    <div class="guide-warning-box">⚠️ Modification et annulation sont impossibles une fois le voyage déjà passé.</div>` 
  },
  { id: 'pdv-trajets', icon: ICONS_GUIDE.trajets, title: 'Trajets disponibles', subtitle: 'Les lignes que vous pouvez vendre', content: `
    <p>Cette page liste tous les trajets sur lesquels <strong>votre PDV est autorisé à vendre</strong> — que ce soit comme point de départ ou comme arrêt intermédiaire. Si votre PDV n'a pas encore été assigné à des trajets, contactez votre siège.</p>

    <p>Chaque carte affiche : la route, les jours et horaires de circulation, le type (direct ou avec arrêts), les prix par type de billet, la limite de bagages, et le nombre de bus actifs sur ce trajet.</p>

    <p><strong>Bouton "Détails"</strong> — ouvre une fiche complète avec les tarifs, le délai de présentation, la liste des arrêts avec leurs prix par tronçon, et tous les bus actifs avec leurs horaires précis.</p>

    <p><strong>Bouton "Vendre"</strong> — vous amène directement à l'écran de vente avec ce trajet déjà pré-sélectionné.</p>` 
  },
  { id: 'pdv-finance', icon: ICONS_GUIDE.finances, title: 'Finances', subtitle: 'Vos encaissements', content: `
    <p>Version simplifiée des finances, centrée sur <strong>votre PDV uniquement</strong>.</p>

    <p><strong>En haut :</strong> le montant encaissé aujourd'hui, mis en avant comme repère fixe quelle que soit la période sélectionnée en dessous.</p>

    <p><strong>Filtres période :</strong> Aujourd'hui, Cette semaine, Ce mois, Tout, ou une période précise. Filtres complémentaires par trajet, bus et statut.</p>

    <p><strong>Trajet le plus vendu</strong> — le trajet ayant généré le plus de revenu sur la période sélectionnée.</p>

    <p><strong>4 indicateurs clés :</strong> montant encaissé, billets vendus, montant annulé, nombre de réservations — chacun comparé à la période équivalente précédente quand c'est pertinent.</p>

    <p><strong>Modifications & retraits</strong> — si des modifications à la baisse ou des retraits de passagers ont eu lieu sur la période, ce bloc en chiffre l'impact.</p>

    <p><strong>Graphique d'activité</strong> — s'adapte à la période choisie (par heure, jour, semaine ou mois), et une <strong>répartition par trajet</strong> classe vos lignes de la plus à la moins rentable.</p>` 
  },
  { id: 'pdv-monpdv', icon: ICONS_GUIDE.monpdv, title: 'Mon point de vente', subtitle: 'Vos informations et performance', content: `
    <p>Cette page centralise les informations de votre point de vente et vos statistiques de performance sur les <strong>30 derniers jours</strong>.</p>

    <p><strong>Informations</strong> — nom du PDV, ville, adresse, téléphone, responsable, et l'agence à laquelle vous êtes rattaché. Ces informations sont en lecture seule ; pour les modifier, contactez votre siège.</p>

    <p><strong>Performance (30 jours)</strong> — ventes brutes, annulations, ventes nettes, taux d'annulation, revenus générés, nombre de trajets couverts, et taux de remplissage moyen de vos bus.</p>

    <p><strong>Trajets assignés</strong> — rappel de toutes les lignes sur lesquelles vous pouvez vendre, avec leurs tarifs.</p>

    <p><strong>Dernières sessions de mes trajets</strong> — un aperçu du taux de remplissage des départs récents sur vos trajets, avec une barre de progression colorée selon le niveau (vert, orange, rouge).</p>` 
  },
];

// ════════════════════════════════
//  ÉTAT — Siège ou PDV
// ════════════════════════════════
let currentGuideMode = 'siege'; // 'siege' | 'pdv'

export function switchGuideMode(mode) {
  currentGuideMode = mode;
  renderGuidePage();
}

export function renderGuidePage() {
  const container = document.getElementById('guideContainer');
  if (!container) return;

  markGuideSeen();

  const sections = currentGuideMode === 'pdv' ? GUIDE_SECTIONS_PDV : GUIDE_SECTIONS;

  container.innerHTML = `
    <div class="guide-intro">
      <p>Travio fonctionne avec <strong>deux interfaces distinctes</strong> : l'espace <strong>Siège</strong> (celui-ci, pour gérer votre agence, vos trajets, vos PDV et vos finances) et l'espace <strong>Point de vente</strong> (utilisé par vos agents pour vendre des billets au quotidien).</p>
      <p><strong>Comment s'y connecter :</strong> depuis la page d'authentification de Travio, le compte <strong>siège</strong> se connecte via "Se connecter" avec l'email et le mot de passe utilisés à la création de l'agence. Vos <strong>agents PDV</strong> se connectent via "Accès Point de vente", avec l'email et le mot de passe que vous leur avez créés dans "Équipe & PDV" — ces identifiants ne fonctionnent pas sur l'accès siège, et inversement.</p>
      <div style="display:flex;gap:4px;background:var(--surface);border-radius:12px;padding:4px;max-width:340px;margin-top:14px;">
        <button id="guideTab-siege" class="equipe-tab-btn ${currentGuideMode === 'siege' ? 'active' : ''}" onclick="switchGuideMode('siege')">
          Guide Siège
        </button>
        <button id="guideTab-pdv" class="equipe-tab-btn ${currentGuideMode === 'pdv' ? 'active' : ''}" onclick="switchGuideMode('pdv')">
          Guide Point de vente
        </button>
      </div>
    </div>
    <div class="guide-accordion">
      ${sections.map(s => `
        <div class="guide-item" id="guideItem-${s.id}">
          <button class="guide-item-head" onclick="toggleGuideSection('${s.id}')">
            <div class="guide-item-icon">${s.icon}</div>
            <div class="guide-item-text">
              <span class="guide-item-title">${s.title}</span>
              <span class="guide-item-subtitle">${s.subtitle}</span>
            </div>
            ${ICONS_GUIDE.chevron}
          </button>
          <div class="guide-item-body" id="guideBody-${s.id}">
            <div class="guide-item-body-inner">
              ${s.content || `<p class="guide-placeholder">Explication à venir.</p>`}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function toggleGuideSection(id) {
  const item = document.getElementById(`guideItem-${id}`);
  const body = document.getElementById(`guideBody-${id}`);
  if (!item || !body) return;

  const isOpen = item.classList.contains('open');

  // Ferme toutes les autres sections (accordéon exclusif)
  document.querySelectorAll('.guide-item.open').forEach(el => {
    el.classList.remove('open');
    const b = el.querySelector('.guide-item-body');
    if (b) b.style.maxHeight = null;
  });

  if (!isOpen) {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}

// ════════════════════════════════
//  BADGE "!" — disparaît une fois la page visitée
// ════════════════════════════════
const GUIDE_SEEN_KEY    = 'travio_guide_seen';
const GUIDE_WELCOME_KEY = 'travio_guide_welcome_shown';

function guideStorageKey(base) {
  const agenceId = agenceData?.id || agenceData?.agenceId || 'default';
  return `${base}_${agenceId}`;
}

export function updateGuideBadge() {
  const badge = document.getElementById('navBadgeGuide');
  if (!badge) return;
  const seen = localStorage.getItem(guideStorageKey(GUIDE_SEEN_KEY));
  badge.classList.toggle('show', !seen);
}

function markGuideSeen() {
  localStorage.setItem(guideStorageKey(GUIDE_SEEN_KEY), '1');
  updateGuideBadge();
}

// ════════════════════════════════
//  MODALE DE BIENVENUE — 3 premiers jours d'essai, une seule fois
// ════════════════════════════════
const DUREE_ESSAI_JOURS = 12; // doit rester cohérent avec agence.js / renderAbonnementPage

function getJoursRestantsEssai() {
  const essai = agenceData?.essai;
  if (!essai || !essai.actif || !essai.dateFin) return null;

  // Même méthode de normalisation de date que dans agence.js (fuseau Brazzaville)
  const fmtBZV = d => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);

  const finJour  = new Date(fmtBZV(new Date(essai.dateFin)) + 'T00:00:00Z');
  const ajdJour  = new Date(fmtBZV(new Date()) + 'T00:00:00Z');
  return Math.round((finJour - ajdJour) / 86400000);
}

export function checkGuideWelcomeModal() {
  const key = guideStorageKey(GUIDE_WELCOME_KEY);
  if (localStorage.getItem(key)) return; // déjà montrée une fois, jamais plus

  const joursRestants = getJoursRestantsEssai();
  if (joursRestants === null) return;

  // 3 premiers jours = joursRestants entre (durée-1) et durée inclus
  // Ex : essai 12 jours → jour 1 = 12 restants, jour 2 = 11, jour 3 = 10
  const joursEcoules = DUREE_ESSAI_JOURS - joursRestants;
  if (joursEcoules < 0 || joursEcoules > 2) return;

  showGuideWelcomeModal();
  localStorage.setItem(key, '1');
}

export function showGuideWelcomeModal() {
  document.getElementById('guideWelcomeOverlay')?.classList.add('show');
}

export function closeGuideWelcomeModal() {
  document.getElementById('guideWelcomeOverlay')?.classList.remove('show');
}

export function goToGuideFromWelcome() {
  closeGuideWelcomeModal();
  window.showPage('guide', document.querySelector('[data-page=guide]'));
}

// ════════════════════════════════
//  EXPOSER AU HTML
// ════════════════════════════════
window.renderGuidePage     = renderGuidePage;
window.toggleGuideSection  = toggleGuideSection;
window.switchGuideMode     = switchGuideMode;