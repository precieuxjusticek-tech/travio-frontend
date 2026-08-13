// ─── TRAVIO — PDV — Aide contextuelle par page ───

const PAGE_HELP_PDV = {
  accueil: {
    title: 'Accueil',
    content: `
      <p>La page Accueil affiche un résumé de <strong>votre activité personnelle</strong> du jour — pas celle du reste du réseau. C'est la première page que vous voyez en vous connectant.</p>

      <p><strong>Les 4 cartes en haut :</strong></p>
      <ul>
        <li><strong>Réservations aujourd'hui</strong> — nombre de réservations que vous avez créées aujourd'hui (annulées incluses).</li>
        <li><strong>Vendus aujourd'hui</strong> — nombre de billets (passagers) vendus aujourd'hui sur des réservations confirmées.</li>
        <li><strong>Revenus colis expédiés du jour</strong> — total encaissé sur les colis expédiés aujourd'hui depuis votre point de vente, avec le nombre de colis correspondant.</li>
        <li><strong>Revenus du jour</strong> — total encaissé aujourd'hui sur vos réservations confirmées, avec le détail billets / colis accompagnés en soute juste en dessous.</li>
      </ul>

      <div class="guide-warning-box">⚠️ Ces 4 chiffres se basent sur la date de <strong>création</strong> de la réservation ou du colis, pas la date du voyage.</div>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/accueil-kpis.png" alt="Exemple des 4 cartes statistiques" class="guide-img">
        <span class="guide-img-caption">Exemple des 4 cartes en haut de la page</span>
      </div>

      <p><strong>Politique d'annulation</strong> — juste au-dessus des 4 cartes, un badge affiche la politique d'annulation en vigueur pour votre agence (vente définitive, sans remboursement, ou avec remboursement et son délai/frais). Elle est configurée par le siège et s'applique automatiquement quand vous annulez une réservation.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/accueil-politique-annulation.png" alt="Exemple du badge de politique d'annulation" class="guide-img">
        <span class="guide-img-caption">Exemple du badge affiché au-dessus des cartes statistiques</span>
      </div>

      <p><strong>Dernières ventes</strong> — affiche vos 5 réservations confirmées les plus récentes, tous jours confondus. Un clic ouvre directement le détail complet de la réservation. Une pastille verte et la mention "Aujourd'hui" signalent les ventes du jour même, et des badges d'alerte apparaissent si un prix a été réduit ou si un passager a été retiré.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/accueil-dernieres-ventes.png" alt="Exemple de la liste des dernières ventes" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc "Dernières ventes"</span>
      </div>

      <p><strong>Accès rapide</strong> — reprend jusqu'à 4 des trajets qui vous sont assignés, avec leur type (Direct ou Avec arrêts), le prix du premier type de billet et l'heure de départ. Cliquer sur un trajet vous amène directement à l'écran de vente avec ce trajet déjà présélectionné.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/accueil-acces-rapide.png" alt="Exemple du bloc Accès rapide" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc "Accès rapide" avec les trajets</span>
      </div>

      <p>Le bouton <strong>"Vendre un billet"</strong> en haut à droite vous amène directement à l'écran de vente.</p>
    `
  },
  vente: {
    title: 'Guichet de vente',
    content: `
      <p>Cette page permet de <strong>vendre un billet ou d'expédier un colis</strong> depuis votre point de vente.</p>

      <div class="guide-warning-box">⚠️ Contrairement au siège, vous ne voyez ici que les <strong>trajets qui vous ont été assignés</strong>. Les places affichées correspondent aussi à votre <strong>sous-quota</strong> sur le bus, pas au nombre total de places restantes tous vendeurs confondus.</div>

      <p><strong>Deux modes en haut de page :</strong> <strong>Billet</strong> (vendre un passage) et <strong>Colis</strong> (expédier un colis). Le formulaire s'adapte selon le mode choisi.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-modes-billet-colis.png" alt="Exemple des modes Billet et Colis" class="guide-img">
        <span class="guide-img-caption">Exemple des deux modes en haut de la page</span>
      </div>

      <h3>Étape 1 — Choisir le trajet</h3>
      <p>Une barre de recherche permet de filtrer par ville, puis deux boutons permettent de basculer entre trajets <strong>Direct</strong> et <strong>Avec arrêts</strong>. Cliquez sur la carte du trajet souhaité dans la liste qui s'affiche.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-recherche-trajet.png" alt="Exemple de la recherche et sélection de trajet" class="guide-img">
        <span class="guide-img-caption">Exemple de la barre de recherche et des cartes de trajets</span>
      </div>

      <p><strong>Session de départ</strong> — une fois le trajet choisi, la liste des prochains départs disponibles apparaît, avec la date, le bus et les places restantes sur votre quota. Cliquez sur une session pour la sélectionner.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-sessions-liste.png" alt="Exemple de la liste des sessions disponibles" class="guide-img">
        <span class="guide-img-caption">Exemple de la liste des sessions de départ disponibles</span>
      </div>

      <h3>Étape 2 (mode Billet) — Passagers</h3>
      <p>Ajoutez un ou plusieurs passagers avec le bouton <strong>"Ajouter un passager"</strong>. Pour chaque passager, prénom, nom et type de billet sont obligatoires. <strong>Le téléphone n'est obligatoire que pour le premier passager</strong> — celui de la réservation.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-passager-form.png" alt="Exemple du formulaire d'un passager" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc d'informations d'un passager</span>
      </div>

      <p>En dépliant <strong>"Bagages, siège (facultatif)"</strong>, vous pouvez renseigner le poids et le nombre de bagages (des frais s'ajoutent automatiquement en cas de dépassement de la limite du trajet), un numéro de siège, et éventuellement un <strong>colis en soute</strong> associé à ce passager (nature, poids, valeur déclarée, prix).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-bagages-colis-soute.png" alt="Exemple des options bagages et colis en soute" class="guide-img">
        <span class="guide-img-caption">Exemple des champs bagages et colis en soute dépliés</span>
      </div>

      <p><strong>Ville de montée et de descente :</strong></p>
      <ul>
        <li><strong>Trajet direct</strong> — vous choisissez le PDV d'embarquement et de débarquement parmi ceux assignés au trajet.</li>
        <li><strong>Trajet avec arrêts</strong> — votre point de montée est <strong>automatiquement fixé</strong> à la position de votre PDV sur la ligne (départ ou arrêt où vous êtes rattaché). Vous choisissez ensuite librement la ville de descente parmi les points suivants sur le trajet, et le PDV de débarquement correspondant (le prix se recalcule automatiquement selon le segment parcouru).</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-montee-descente-arrets.png" alt="Exemple du choix de montée et descente sur un trajet avec arrêts" class="guide-img">
        <span class="guide-img-caption">Exemple de la montée fixée au PDV et du choix libre de la descente</span>
      </div>

      <p>Le <strong>récapitulatif du prix</strong> se met à jour en temps réel en bas du formulaire, passager par passager, jusqu'au total à encaisser. Cliquez sur <strong>"Vérifier et confirmer"</strong> pour ouvrir un récapitulatif complet de la vente.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-recap-prix-billet.png" alt="Exemple du récapitulatif de prix pour un billet" class="guide-img">
        <span class="guide-img-caption">Exemple du récapitulatif de prix avant validation</span>
      </div>

      <p>Une fenêtre s'ouvre alors avec le détail complet — trajet, passagers, remarques et total. Cliquez sur <strong>"Confirmer et enregistrer"</strong> pour finaliser la vente, ou <strong>"Modifier"</strong> pour revenir en arrière.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-modal-recap.png" alt="Exemple de la fenêtre de récapitulatif final" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre de récapitulatif avant confirmation définitive</span>
      </div>

      <h3>Étape 2 (mode Colis) — Expéditeur, destinataire et colis</h3>
      <p>Renseignez les coordonnées complètes de l'<strong>expéditeur</strong> et du <strong>destinataire</strong> (nom et téléphone obligatoires pour les deux), puis les détails du colis : nature (obligatoire), poids estimé, valeur déclarée (optionnelle) et prix du transport (obligatoire).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-colis-form.png" alt="Exemple du formulaire expéditeur, destinataire et colis" class="guide-img">
        <span class="guide-img-caption">Exemple du formulaire du mode Colis</span>
      </div>

      <p>Comme pour un billet, vous choisissez le point d'embarquement et de débarquement du colis. Une fois la vente confirmée, un <strong>code de retrait</strong> est généré — à transmettre au destinataire pour qu'il puisse récupérer le colis à l'arrivée.</p>

      <div class="guide-warning-box">⚠️ Après confirmation, le formulaire se réinitialise automatiquement pour une nouvelle vente — pensez à noter ou transmettre le code de retrait affiché avant de continuer.</div>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/vente-code-retrait.png" alt="Exemple du code de retrait généré après expédition" class="guide-img">
        <span class="guide-img-caption">Exemple du code de retrait affiché après confirmation d'un colis</span>
      </div>
    `
  },
  reservations: {
    title: 'Mes réservations',
    content: `
      <p>Cette page liste <strong>uniquement les réservations vendues par votre point de vente</strong>, avec des filtres avancés et un panneau de détail complet pour chaque billet.</p>

      <p><strong>Filtres de période :</strong> Aujourd'hui / Cette semaine / Ce mois / Tout, ou une <strong>période précise</strong> (une date de début et de fin).</p>

      <p><strong>Barre de recherche et filtres :</strong> recherche par nom ou téléphone, filtre par trajet, par bus (dépendant du trajet choisi), par statut, et un tri (plus récent, plus ancien, prix croissant/décroissant).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/reservations-filtres.png" alt="Exemple des filtres de réservations" class="guide-img">
        <span class="guide-img-caption">Exemple des filtres de période, recherche et tri</span>
      </div>

      <p>4 cartes résument la sélection filtrée : <strong>Billets vendus</strong>, <strong>Encaissé</strong>, <strong>Réservations</strong> et <strong>Réaffectées</strong> (déplacées vers un autre bus suite à un changement décidé par le siège).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/reservations-mini-stats.png" alt="Exemple des mini-statistiques" class="guide-img">
        <span class="guide-img-caption">Exemple des 4 cartes de statistiques</span>
      </div>

      <p><strong>Cliquer sur une réservation</strong> ouvre son détail complet, organisé en 3 onglets :</p>
      <ul>
        <li><strong>Trajet</strong> — ligne, date, heure, bus, date et heure de vente, points d'embarquement/débarquement, et les remarques éventuelles en dessous.</li>
        <li><strong>Passager(s)</strong> — coordonnées, type de billet, siège, bagages et colis en soute de chaque passager (un bloc par passager si la réservation en compte plusieurs).</li>
        <li><strong>Billet</strong> — le billet de contrôle, avec un choix entre affichage Code et QR Code, et un bouton pour l'imprimer directement.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/reservations-detail-onglets.png" alt="Exemple du détail d'une réservation avec ses onglets" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau de détail avec les 3 onglets</span>
      </div>

      <p><strong>Modifier une réservation</strong> — possible <strong>une seule fois</strong>. Vous pouvez changer les infos passager, la ville de descente et le lieu de débarquement, et les bagages. Le prix est recalculé automatiquement. Si le nouveau prix est inférieur à l'ancien, une raison est obligatoire.</p>

      <div class="guide-warning-box">⚠️ La ville de montée n'est pas modifiable : elle reste fixée à la position de votre point de vente sur le trajet.</div>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/reservations-modification.png" alt="Exemple du formulaire de modification" class="guide-img">
        <span class="guide-img-caption">Exemple du formulaire de modification d'une réservation</span>
      </div>

      <p><strong>Annuler une réservation</strong> — le remboursement dépend de la politique d'annulation de votre agence (visible sur la page Accueil) : vente définitive, sans remboursement, ou avec remboursement (avec délai et frais éventuels). Un résumé financier s'affiche avant confirmation.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/reservations-confirmation-annulation.png" alt="Exemple de la confirmation d'annulation" class="guide-img">
        <span class="guide-img-caption">Exemple du résumé financier avant annulation</span>
      </div>

      <p><strong>Réservation multi-passagers</strong> — un passager peut être retiré individuellement du billet sans annuler toute la réservation, avec son propre résumé financier de remboursement.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/reservations-confirmation-annulation.png" alt="Exemple du retrait d'un passager" class="guide-img">
        <span class="guide-img-caption">Exemple de la liste des passagers avec l'option de retrait individuel</span>
      </div>

      <div class="guide-warning-box">⚠️ Une réservation ne peut être ni modifiée ni annulée si le voyage a déjà eu lieu.</div>
    `
  },
  trajets: {
    title: 'Trajets disponibles',
    content: `
      <p>Cette page liste <strong>uniquement les trajets qui vous ont été assignés</strong> par le siège. Si un trajet n'apparaît pas ici, c'est qu'il ne vous a pas encore été attribué — contactez votre agence pour être ajouté.</p>

      <p><strong>La carte d'un trajet</strong> affiche l'itinéraire, les jours de circulation et horaires, le type (Direct ou Avec arrêts), la limite de bagages, les tarifs par type de billet, le détail des arrêts si le trajet en a, et le nombre de bus actifs actuellement programmés dessus.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/trajets-carte.png" alt="Exemple d'une carte de trajet" class="guide-img">
        <span class="guide-img-caption">Exemple d'une carte de trajet avec ses informations</span>
      </div>

      <p>Deux boutons sont disponibles sur chaque carte : <strong>"Détails"</strong> ouvre une fiche complète du trajet, et <strong>"Vendre"</strong> vous amène directement à l'écran de vente avec ce trajet déjà présélectionné.</p>

      <h3>La fiche détaillée d'un trajet</h3>
      <p>En cliquant sur "Détails", un panneau s'ouvre avec : les tarifs par type de billet et la limite de bagages, le délai de présentation avant le départ (défini par le siège), le détail des arrêts intermédiaires si le trajet en a, le tableau des prix par tronçon (pour les trajets avec arrêts), et la liste des bus actuellement actifs sur ce trajet avec leurs horaires et jours de circulation.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/trajets-fiche-detail.png" alt="Exemple de la fiche détaillée d'un trajet" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau de détail ouvert après un clic sur "Détails"</span>
      </div>

      <p>Un bouton <strong>"Vendre un billet sur ce trajet"</strong> en bas de la fiche vous amène directement à l'écran de vente.</p>

      <div class="guide-warning-box">⚠️ Cette page est en lecture seule — vous ne pouvez ni créer, ni modifier, ni supprimer un trajet ou un bus depuis votre interface. Toute la gestion des trajets et de la flotte se fait côté siège.</div>
    `
  },
  monpdv: {
    title: 'Mon point de vente',
    content: `
      <p>Cette page affiche les informations de votre point de vente et vos statistiques de performance des <strong>30 derniers jours</strong>. Toutes les informations y sont en <strong>lecture seule</strong> — pour toute correction, contactez votre siège.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/monpdv-hero.png" alt="Exemple de la carte d'en-tête du PDV" class="guide-img">
        <span class="guide-img-caption">Exemple de la carte d'en-tête avec le nom, la ville et l'agence</span>
      </div>

      <p><strong>Bloc Informations</strong> — reprend le nom du PDV, la ville, l'adresse, le téléphone, le responsable et l'agence de rattachement.</p>

      <p><strong>Bloc Performance (30 jours)</strong> — donne une vue chiffrée de votre activité récente :</p>
      <ul>
        <li><strong>Ventes brutes</strong> — nombre total de billets vendus, annulations incluses.</li>
        <li><strong>Annulations</strong> — nombre de billets annulés sur la période.</li>
        <li><strong>Ventes nettes</strong> — ventes brutes moins les annulations.</li>
        <li><strong>Taux d'annulation</strong> — proportion de billets annulés par rapport aux ventes brutes.</li>
        <li><strong>Revenus générés</strong> — total encaissé sur le mois en cours.</li>
        <li><strong>Trajets couverts</strong> — nombre de trajets qui vous sont assignés.</li>
        <li><strong>Taux de remplissage moyen</strong> — moyenne du taux de remplissage des bus sur lesquels vous avez vendu.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/monpdv-hero.png" alt="Exemple des blocs Informations et Performance" class="guide-img">
        <span class="guide-img-caption">Exemple des blocs Informations et Performance côte à côte</span>
      </div>

      <p><strong>Trajets assignés</strong> — la liste complète des trajets sur lesquels vous êtes autorisé à vendre, avec leur type, horaires et tarifs par type de billet.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/monpdv-trajets-assignes.png" alt="Exemple de la liste des trajets assignés" class="guide-img">
        <span class="guide-img-caption">Exemple de la liste des trajets assignés</span>
      </div>

      <p><strong>Dernières sessions de mes trajets</strong> — les sessions récentes de vos trajets assignés, avec la route, le bus, et une barre de remplissage colorée (vert : places disponibles, orange : bus bien rempli, rouge : bus presque complet).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/monpdv-sessions-recentes.png" alt="Exemple des dernières sessions" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc des dernières sessions avec leur taux de remplissage</span>
      </div>

      <div class="guide-warning-box">⚠️ Le taux de remplissage moyen et les sessions récentes tiennent compte de <strong>tous les vendeurs</strong> sur ces bus, pas uniquement de vos propres ventes.</div>
    `
  },
  colis: {
    title: 'Colis',
    content: `
      <p>Cette page permet de suivre les colis liés à votre point de vente : ceux que vous <strong>expédiez</strong> depuis votre PDV, et ceux que vous devez <strong>réceptionner</strong> parce que votre PDV est le point de débarquement.</p>

      <p><strong>Deux modes en haut de page :</strong></p>
      <ul>
        <li><strong>À réceptionner</strong> — les colis dont votre PDV est le point de débarquement, à faire avancer dans leur cycle de vie.</li>
        <li><strong>Envoyés</strong> — l'historique des colis que vous avez expédiés depuis votre PDV (en lecture seule, suivi uniquement).</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/colis-modes.png" alt="Exemple des modes À réceptionner et Envoyés" class="guide-img">
        <span class="guide-img-caption">Exemple des deux modes en haut de la page</span>
      </div>

      <h3>Le cycle de vie d'un colis</h3>
      <p>Un colis passe toujours par 3 statuts, dans cet ordre :</p>
      <ul>
        <li><strong>En transit</strong> — le colis est en cours d'acheminement.</li>
        <li><strong>Arrivé</strong> — le colis est arrivé à destination et attend d'être retiré.</li>
        <li><strong>Retiré</strong> — le destinataire (ou une personne mandatée) a récupéré le colis. C'est un statut final.</li>
      </ul>

      <div class="guide-warning-box">⚠️ Vous ne pouvez faire avancer le statut d'un colis que si votre PDV est bien son <strong>point de débarquement</strong>. Sinon, le détail du colis vous l'indique clairement sans action possible.</div>

      <h3>Alerte — Colis en attente de retrait</h3>
      <p>Une carte d'alerte apparaît automatiquement dès qu'au moins un colis est <strong>arrivé depuis 3 jours ou plus</strong> sans avoir été retiré. Un clic sur cette carte filtre instantanément la liste sur ces colis précis.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/colis-alerte.png" alt="Exemple de l'alerte colis en attente" class="guide-img">
        <span class="guide-img-caption">Exemple de la carte d'alerte "Colis en attente de retrait"</span>
      </div>

      <h3>Filtres et recherche</h3>
      <p>Filtres de période (Tout / Aujourd'hui / Cette semaine / Ce mois / période précise), recherche libre (nom, téléphone ou <strong>code de retrait</strong>), filtres par trajet et par bus (en cascade), filtre par statut, et un tri (plus récent, plus ancien, prix croissant/décroissant).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/colis-filtres.png" alt="Exemple des filtres de la page Colis" class="guide-img">
        <span class="guide-img-caption">Exemple des filtres de période et des filtres détaillés</span>
      </div>

      <h3>Vérifier un code de retrait</h3>
      <p>Le bouton <strong>"Vérifier un code de retrait"</strong> permet de saisir directement le code fourni par un destinataire pour retrouver son colis rapidement, sans avoir à le chercher dans la liste, et d'ouvrir son détail en un clic.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/colis-verification-code.png" alt="Exemple de la vérification par code" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre de vérification d'un code de retrait</span>
      </div>

      <h3>Le détail d'un colis</h3>
      <p>Cliquer sur un colis ouvre un panneau avec toutes les informations : expéditeur, destinataire, trajet, bus, points d'embarquement et de débarquement, nature du colis, poids, valeur déclarée, et remarques éventuelles.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/colis-detail.png" alt="Exemple du détail d'un colis" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau de détail d'un colis</span>
      </div>

      <h4>Faire avancer le statut (si vous êtes le PDV de débarquement)</h4>
      <p>Depuis le détail, deux actions sont possibles selon le statut actuel :</p>
      <ul>
        <li><strong>"Marquer comme arrivé"</strong> (si le colis est en transit) — passage immédiat au statut Arrivé, sans confirmation supplémentaire.</li>
        <li><strong>"Confirmer le retrait"</strong> (si le colis est arrivé) — ouvre une fenêtre de confirmation obligatoire.</li>
      </ul>

      <h4>La confirmation de retrait</h4>
      <p>Avant de marquer un colis comme retiré, vous devez renseigner :</p>
      <ul>
        <li>Le <strong>nom de la personne</strong> qui retire le colis (qui peut être différente du destinataire initial).</li>
        <li>Le <strong>type de pièce d'identité</strong> présentée : CNI, passeport, permis de conduire, ou "Aucune pièce disponible".</li>
        <li>Selon le choix : le <strong>numéro de la pièce</strong>, ou, si aucune pièce n'est disponible, une <strong>précision obligatoire</strong> (ex : nom d'un témoin, motif).</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/colis-confirmation-retrait.png" alt="Exemple de la fenêtre de confirmation de retrait" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre de confirmation avant de marquer un colis comme retiré</span>
      </div>

      <div class="guide-warning-box">⚠️ Une fois un colis marqué "Retiré", ce statut est <strong>définitif</strong> — il ne peut plus être remis à "Arrivé" ou "En transit" depuis cette page.</div>

      <h3>Le badge dans le menu</h3>
      <p>Le badge affiché à côté de "Colis" dans le menu latéral correspond au nombre de colis actuellement au statut <strong>En transit</strong> et destinés à votre PDV.</p>
    `
  },
  finance: {
    title: 'Finances',
    content: `
      <p>Cette page donne une vue complète de <strong>vos encaissements</strong> — billets, colis accompagnés en soute et colis expédiés — avec des filtres par période, trajet, bus et statut.</p>

      <p><strong>Encaissé aujourd'hui</strong> — en haut de page, un bandeau fixe affiche toujours le total encaissé du jour même, indépendamment des filtres de période choisis plus bas, avec le nombre de billets vendus.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-hero.png" alt="Exemple du bandeau Encaissé aujourd'hui" class="guide-img">
        <span class="guide-img-caption">Exemple du bandeau fixe "Encaissé aujourd'hui"</span>
      </div>

      <p><strong>Filtres de période :</strong> Aujourd'hui / Cette semaine / Ce mois / Tout, ou une <strong>période précise</strong> (date de début et de fin). Des filtres supplémentaires permettent de restreindre par trajet, par bus et par statut de réservation (confirmées, annulées, avec retrait passager).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-filtres.png" alt="Exemple des filtres de la page Finances" class="guide-img">
        <span class="guide-img-caption">Exemple des filtres de période et des filtres détaillés</span>
      </div>

      <p><strong>Trajet le plus vendu</strong> — met en avant, pour la période filtrée, le trajet ayant généré le plus de revenu, avec le nombre de billets vendus et le montant total.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-meilleur-trajet.png" alt="Exemple du bloc Trajet le plus vendu" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc "Trajet le plus vendu"</span>
      </div>

      <p><strong>Les KPIs de la période :</strong></p>
      <ul>
        <li><strong>Total encaissé</strong> — somme des billets, des colis accompagnés en soute et des colis expédiés sur la période.</li>
        <li><strong>Billets</strong> — revenu des billets seuls (hors colis).</li>
        <li><strong>Billets vendus</strong> — nombre de billets sur la période, annulations incluses.</li>
        <li><strong>Annulé</strong> — montant total et nombre de réservations annulées sur la période.</li>
        <li><strong>Réservations</strong> — nombre total de réservations créées sur la période.</li>
        <li><strong>Colis accompagnés</strong> — revenu et nombre de colis envoyés en soute avec un passager.</li>
      </ul>

      <div class="guide-warning-box">⚠️ Un pourcentage d'évolution s'affiche sous chaque carte, comparé à la période équivalente précédente (ex : cette semaine vs semaine dernière). Il n'apparaît pas en filtre "Tout".</div>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-kpis.png" alt="Exemple des cartes KPI de la page Finances" class="guide-img">
        <span class="guide-img-caption">Exemple des cartes de statistiques financières</span>
      </div>

      <p><strong>Revenu colis</strong> — un bloc dédié résume, pour la période, le revenu des colis <strong>expédiés</strong> (hors colis en soute), avec le nombre total et leur répartition par statut (en transit, retirés).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-colis-stats.png" alt="Exemple du bloc Revenu colis" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc de statistiques colis</span>
      </div>

      <p><strong>Modifications & retraits</strong> — ce panneau n'apparaît que s'il y a eu des modifications à la baisse ou des retraits de passagers sur la période, avec le montant total impacté dans chaque cas.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-impact.png" alt="Exemple du bloc Modifications et retraits" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau "Modifications & retraits"</span>
      </div>

      <p><strong>Graphique d'activité</strong> — visualise l'évolution du revenu selon la période choisie : par tranche horaire (Aujourd'hui), par jour (Cette semaine), par semaine (Ce mois) ou par mois (Tout, 6 derniers mois).</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-graphique.png" alt="Exemple du graphique d'activité" class="guide-img">
        <span class="guide-img-caption">Exemple du graphique d'évolution du revenu</span>
      </div>

      <p><strong>Répartition par trajet</strong> — liste tous les trajets sur lesquels vous avez vendu pendant la période, triés par revenu décroissant, avec le nombre de billets vendus par trajet.</p>

      <div class="guide-img-wrap">
        <img src="image-helps-pdv/finance-repartition-trajets.png" alt="Exemple de la répartition par trajet" class="guide-img">
        <span class="guide-img-caption">Exemple de la liste de répartition par trajet</span>
      </div>

      <div class="guide-warning-box">⚠️ Toutes les statistiques de cette page se basent sur la date de <strong>création</strong> de la réservation ou du colis, pas la date du voyage.</div>
    `
  },
};

export function openPageHelp(pageId) {
  const data = PAGE_HELP_PDV[pageId];
  if (!data) return;
  document.getElementById('pageHelpTitle').textContent = data.title;
  document.getElementById('pageHelpBody').innerHTML = data.content;
  document.getElementById('pageHelpOverlay')?.classList.add('show');
}

export function closePageHelp() {
  document.getElementById('pageHelpOverlay')?.classList.remove('show');
}

window.openPageHelp = openPageHelp;
window.closePageHelp = closePageHelp;