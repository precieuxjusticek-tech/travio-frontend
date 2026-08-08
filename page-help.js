// ─── TRAVIO — Aide contextuelle par page ───

const PAGE_HELP = {
  overview: {
    title: 'Vue d\'ensemble',
    content: `
      <p>La Vue d'ensemble vous donne un résumé rapide de l'activité <strong>du jour même</strong>. C'est la première page que vous voyez en vous connectant.</p>

      <p><strong>Les 4 cartes en haut :</strong></p>
      <ul>
        <li><strong>Réservations aujourd'hui</strong> — nombre de réservations créées aujourd'hui (les annulées ne sont pas comptées).</li>
        <li><strong>Revenus du jour</strong> — total encaissé sur ces réservations du jour.</li>
        <li><strong>Revenus colis du jour</strong> — total encaissé sur les colis expédiés aujourd'hui, avec le nombre de colis correspondant.</li>
        <li><strong>Billets vendus aujourd'hui</strong> — nombre de passagers inclus dans les réservations créées aujourd'hui.</li>
      </ul>

      <div class="guide-warning-box">⚠️ Ces 4 chiffres se basent sur la date de <strong>création</strong> de la réservation, pas la date du voyage.</div>

      <div class="guide-img-wrap">
        <img src="image-helps/kpis-vue-d'ensemble.png" alt="Exemple des cartes statistiques" class="guide-img">
        <span class="guide-img-caption">Exemple des 4 cartes en haut de la page</span>
      </div>

      <p><strong>Dernières réservations</strong> — affiche les 5 réservations confirmées les plus récentes. Un clic dessus ouvre directement son détail. Des alertes s'affichent si un prix a été réduit ou si un passager a été retiré.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/liste-reserve.png" alt="Exemple de la liste des dernières réservations" class="guide-img">
        <span class="guide-img-caption">Exemple de la liste "Dernières réservations"</span>
      </div>

      <div class="guide-img-wrap">
        <img src="image-helps/detail-reservation.png" alt="Exemple du détail d'une réservation ouverte" class="guide-img">
        <span class="guide-img-caption">Exemple du détail affiché après un clic sur une réservation</span>
      </div>

      <p><strong>Actions rapides :</strong></p>
      <ul>
        <li><strong>Vendre</strong> — vente depuis le siège. Contrairement à un PDV, qui ne peut vendre que sur les trajets qui lui sont assignés, aucun trajet n'est limité ici.</li>
        <li><strong>Ajouter un trajet</strong> — programmer un nouveau départ.</li>
        <li><strong>Ajouter un PDV</strong> — créer un nouveau point de vente.</li>
        <li><strong>Modifier l'agence</strong> — accès direct à la fiche agence pour changer les infos, photos ou description.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/action-rapide.png" alt="Exemple des actions rapides" class="guide-img">
        <span class="guide-img-caption">Exemple du bloc "Actions rapides"</span>
      </div>
    `
  },
  reservations: {
    title: 'Réservations',
    content: `
      <p>Cette page centralise <strong>toutes les réservations</strong> de votre réseau (siège + tous les PDV), avec des filtres avancés et un panneau de détail complet pour chaque billet.</p>

      <p><strong>Filtres de période :</strong> en haut à droite, choisissez Aujourd'hui / Semaine / Mois / Tout, ou définissez une <strong>période précise</strong> (une date de début et de fin).</p>

      <p><strong>Filtres détaillés :</strong> Ville, PDV, Trajet, Bus, Statut et une recherche par nom/téléphone. Ces filtres fonctionnent <strong>en cascade</strong> — par exemple, choisir une ville ne montre ensuite que les PDV de cette ville, puis les trajets desservis par ces PDV.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/filtres-reservations.png" alt="Exemple des filtres de réservations" class="guide-img">
        <span class="guide-img-caption">Exemple des filtres de période et des filtres détaillés</span>
      </div>

      <p>Trois boutons sont aussi disponibles : <strong>Imprimer</strong> (impression directe), <strong>Rapport Travio</strong> (export PDF détaillé) et <strong>Réinitialiser les filtres</strong>.</p>

      <p><strong>Deux onglets :</strong></p>
      <ul>
        <li><strong>Vue d'ensemble</strong> — affiche les alertes de votre réseau (trajets sous-performants, PDV inactifs, annulations récentes, modifications à la baisse non vérifiées) ainsi que des statistiques globales : total réservations, taux d'annulation, PDV vendeurs actifs.</li>
        <li><strong>Détail des réservations</strong> — la liste complète, filtrable, avec des stats sur les billets vendus, les passagers déjà transportés, les passagers retirés et les réservations réaffectées.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/alertes-reservations.png" alt="Exemple des cartes d'alertes" class="guide-img">
        <img src="image-helps/alertes-reservations-clic.png" alt="Exemple des cartes d'alertes après clic" class="guide-img">
        <span class="guide-img-caption">Exemple des alertes — un clic sur une carte affiche le détail concerné</span>
      </div>

      <div class="guide-img-wrap">
        <img src="image-helps/liste-detail-reservations.png" alt="Exemple de la liste détaillée des réservations" class="guide-img">
        <span class="guide-img-caption">Exemple de l'onglet "Détail des réservations"</span>
      </div>

      <p><strong>Cliquer sur une réservation</strong> ouvre son détail complet : infos du trajet, informations du/des passager(s), billet de contrôle (code ou QR code, imprimable), et remarques éventuelles.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/detail-reservation.png" alt="Exemple du détail d'une réservation ouverte" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau de détail d'une réservation</span>
      </div>

      <p><strong>Modifier une réservation</strong> — possible <strong>une seule fois</strong>. On peut changer les infos passager, la ville de montée/descente, le lieu d'embarquement/débarquement et les bagages. Le prix est recalculé automatiquement. Si le nouveau prix est inférieur à l'ancien, une raison est obligatoire.</p>

      <p><strong>Annuler une réservation</strong> — le remboursement dépend de la politique d'annulation de l'agence (définie dans "Mon agence") : vente définitive, sans remboursement, ou avec remboursement (avec délai et frais éventuels). Un résumé financier s'affiche avant confirmation.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/confirmation-annulation.png" alt="Exemple de la confirmation d'annulation" class="guide-img">
        <span class="guide-img-caption">Exemple du résumé financier avant annulation</span>
      </div>

      <p><strong>Réservation multi-passagers</strong> — un passager peut être retiré individuellement du billet sans annuler toute la réservation.</p>

      <div class="guide-warning-box">⚠️ Une réservation ne peut être ni modifiée ni annulée si le voyage a déjà eu lieu.</div>
    `
  },
  trajets: {
    title: 'Trajets',
    content: `
      <p>Cette page regroupe <strong>deux notions différentes mais liées</strong> : le <strong>trajet</strong> (la ligne que vous proposez, ex : Brazzaville → Pointe-Noire) et le <strong>bus</strong> (le véhicule physique qui circule sur ce trajet, avec ses propres horaires et jours). Un trajet peut avoir plusieurs bus, et un même bus (véhicule) peut circuler sur plusieurs trajets différents. La gestion des bus, de la flotte et des sessions est expliquée dans l'aide de l'onglet "Flotte de bus".</p>

      <p><strong>Deux onglets en haut de la page :</strong></p>
      <ul>
        <li><strong>Trajets</strong> — la liste de vos lignes.</li>
        <li><strong>Flotte de bus</strong> — la liste de vos véhicules (indépendante des trajets).</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/onglets-trajets-bus.png" alt="Exemple des onglets Trajets et Flotte de bus" class="guide-img">
        <span class="guide-img-caption">Exemple des deux onglets de la page</span>
      </div>

      <h3>Les 4 indicateurs en haut de la page</h3>
      <p>Ces 4 cartes donnent un état des lieux instantané de votre réseau de trajets et de bus, sans avoir à ouvrir chaque fiche individuellement :</p>
      <ul>
        <li><strong>Trajets actifs</strong> — nombre de trajets activés sur le nombre total de trajets créés dans l'agence (actifs et inactifs confondus).</li>
        <li><strong>Bus actifs (flotte)</strong> — nombre de véhicules activés sur le nombre total de véhicules de votre flotte, qu'ils soient assignés à un trajet ou non. C'est un statut du véhicule lui-même.</li>
        <li><strong>Trajets sans bus</strong> — nombre de trajets actifs qui n'ont <strong>aucun bus assigné et actif</strong> dessus. Un trajet compte ici même si un bus lui est assigné mais désactivé. C'est une alerte : ces trajets sont ouverts mais invendables, faute de bus programmé.</li>
        <li><strong>Bus non assignés</strong> — nombre de véhicules actifs de la flotte qui ne circulent sur aucun trajet actif en ce moment. C'est le miroir du précédent : des bus disponibles mais inexploités.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/kpis-trajets-bus.png" alt="Exemple des 4 cartes statistiques de la page Trajets" class="guide-img">
        <span class="guide-img-caption">Exemple des 4 indicateurs en haut de la page Trajets & Bus</span>
      </div>

      <div class="guide-warning-box">⚠️ "Trajets sans bus" et "Bus non assignés" sont complémentaires : si les deux affichent un chiffre supérieur à 0 en même temps, il suffit souvent d'assigner un bus non utilisé à un trajet qui en manque pour régler les deux problèmes d'un coup.</div>

      <h3>Avant de créer un trajet : les types de billets</h3>
      <p>Un trajet a besoin d'au moins un type de billet pour définir ses prix (ex : Adulte, Enfant). Vous les configurez une seule fois pour toute l'agence via le bouton <strong>"Types de billets"</strong>, avec une tranche d'âge par type (3 types maximum). Si vous n'avez pas encore configuré de types, l'application vous y redirige automatiquement à la création d'un trajet.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/types-billets.png" alt="Exemple de la fenêtre types de billets" class="guide-img">
        <span class="guide-img-caption">Exemple de configuration des types de billets</span>
      </div>

      <h3>Créer un trajet (étape 1 : itinéraire)</h3>
      <p>Vous choisissez d'abord la <strong>ville de départ</strong> et la <strong>ville d'arrivée</strong> dans deux listes déroulantes (une ville ne peut pas être sélectionnée des deux côtés). Puis vous choisissez le <strong>type de trajet</strong> :</p>
      <ul>
        <li><strong>Direct</strong> — le bus va d'une ville à l'autre sans arrêt intermédiaire vendable.</li>
        <li><strong>Avec arrêts</strong> — le bus dessert une ou plusieurs villes/lieux intermédiaires où des passagers peuvent monter ou descendre.</li>
      </ul>

      <h4>Les cases à cocher "PDV de départ" et "PDV d'arrivée"</h4>
      <p>Dès que vous avez choisi une ville de départ, une liste de cases à cocher apparaît automatiquement juste en dessous : ce sont <strong>tous les points de vente actifs qui se trouvent dans cette ville</strong>. Il en va de même pour la ville d'arrivée. <strong>Cocher un PDV lui donne le droit de vendre des billets sur ce trajet.</strong> Un PDV non coché ne verra tout simplement pas ce trajet dans son interface de vente, même s'il est situé dans la bonne ville.</p>

      <div class="guide-warning-box">⚠️ Un trajet ne peut pas exister sans <strong>au moins un PDV de départ coché</strong>. C'est ce qui permet de vendre des billets depuis la ville de départ. Sans ça, la création est bloquée. Le PDV d'arrivée n'est pas obligatoire, mais sans lui, personne ne pourra vendre de billets retour depuis la ville d'arrivée.</div>

      <p>Si aucun PDV n'existe encore dans la ville choisie, la liste affiche un message vous en informant — il faudra d'abord créer un PDV dans cette ville (page "Équipe & PDV") avant de pouvoir continuer.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/pdv-checkbox-depart-arrivee.png" alt="Exemple des cases à cocher PDV de départ et d'arrivée" class="guide-img">
        <span class="guide-img-caption">Exemple : cocher un PDV lui donne accès à la vente sur ce trajet</span>
      </div>

      <h3>Trajet avec arrêts : comment ça fonctionne en détail</h3>
      <p>Quand vous choisissez "Avec arrêts", un bloc "Arrêts intermédiaires" apparaît. Vous cliquez sur <strong>"+ Ajouter une étape"</strong> pour chaque point de passage. Voici ce que vous voyez et devez remplir pour chaque arrêt ajouté :</p>

      <h4>1. Le choix de la ville de l'arrêt</h4>
      <p>Une liste déroulante vous propose des villes. <strong>Important : cette liste n'affiche que les villes où vous avez déjà au moins un PDV actif</strong> (en excluant la ville de départ et d'arrivée, déjà utilisées). Si l'endroit où le bus doit s'arrêter n'a pas de PDV chez vous (par exemple un simple carrefour, une station-service, un point de repère), choisissez l'option <strong>"Autre lieu..."</strong> tout en bas de la liste : un champ texte libre apparaît alors pour taper le nom de ce lieu.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/arret-choix-ville.png" alt="Exemple du choix de ville pour un arrêt" class="guide-img">
        <span class="guide-img-caption">Exemple : liste des villes avec PDV, et option "Autre lieu..." pour un point sans PDV</span>
      </div>

      <h4>2. Les deux types d'arrêt qui en résultent</h4>
      <ul>
        <li><strong>Arrêt PDV</strong> (ville choisie dans la liste) — dès que vous choisissez cette ville, une nouvelle liste de cases à cocher apparaît juste en dessous avec <strong>tous les PDV actifs de cette ville</strong>. Comme pour le départ/l'arrivée, cocher un PDV lui donne le droit de vendre des billets pour cet arrêt précis. Ces cases sont cochées par défaut (tous les PDV de la ville sont sélectionnés), vous pouvez décocher ceux qui ne doivent pas vendre sur cet arrêt.</li>
        <li><strong>Lieu libre</strong> (option "Autre lieu...") — aucune case PDV n'apparaît puisqu'il n'y a pas de point de vente à cet endroit. Le bus s'y arrêtera simplement (information affichée aux voyageurs), sans possibilité d'achat de billet à cet endroit précis.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/arret-checkbox-pdv.png" alt="Exemple des cases à cocher PDV pour un arrêt" class="guide-img">
        <span class="guide-img-caption">Exemple : cases à cocher des PDV disponibles dans la ville de l'arrêt choisie</span>
      </div>

      <h4>3. Les champs à remplir pour chaque arrêt</h4>
      <p>Une fois la ville (ou le lieu libre) choisi, une grille de champs apparaît pour cet arrêt précis :</p>
      <ul>
        <li><strong>Heure de passage</strong> — l'heure approximative à laquelle le bus arrive à cet arrêt (optionnel mais recommandé, affiché aux voyageurs).</li>
        <li><strong>Un champ "Prix" par type de billet configuré</strong> — par exemple si vous avez 2 types (Adulte, Enfant), vous verrez 2 champs de prix pour cet arrêt. <strong>Ce prix correspond au tarif entre la ville de départ du trajet et cet arrêt.</strong> Ces champs sont obligatoires : si un prix manque, la création du trajet sera bloquée avec un message d'erreur précisant à quel arrêt il manque un prix.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/arret-checkbox-pdv.png" alt="Exemple des champs heure et prix pour un arrêt" class="guide-img">
        <span class="guide-img-caption">Exemple : heure de passage + un champ de prix par type de billet, pour chaque arrêt</span>
      </div>

      <div class="guide-warning-box">⚠️ Plus vous avez de types de billets et d'arrêts, plus le nombre de champs de prix affichés augmente. C'est normal : chaque arrêt a besoin de son propre prix pour chaque type de billet, car le tarif change selon la distance parcourue depuis le départ.</div>

      <h4>4. Le tableau "Prix par tronçon" (en bas du formulaire)</h4>
      <p>Une fois qu'au moins un arrêt est ajouté avec une ville valide, un nouveau bloc apparaît automatiquement plus bas : <strong>"Prix par tronçon"</strong>. Contrairement aux prix des arrêts (qui partent toujours de la ville de départ), ce tableau sert à définir le prix <strong>entre deux points quelconques du trajet qui ne sont pas la ville de départ</strong> — par exemple entre le 1er arrêt et le 2ème, ou entre le 2ème arrêt et la ville d'arrivée finale.</p>
      <p>L'application génère automatiquement une carte pour chaque combinaison possible (from → to), avec un champ de prix par type de billet à remplir pour chacune. Ce tableau se met à jour en temps réel à chaque fois que vous ajoutez, modifiez ou supprimez un arrêt.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/troncons-tableau.png" alt="Exemple du tableau de prix par tronçon" class="guide-img">
        <span class="guide-img-caption">Exemple : le tableau des tronçons se génère automatiquement selon les arrêts ajoutés</span>
      </div>

      <div class="guide-warning-box">⚠️ En résumé sur les prix d'un trajet avec arrêts : les prix "depuis la ville de départ" sont saisis directement dans chaque carte d'arrêt (étape 1). Les prix "entre deux autres points" sont saisis dans le tableau des tronçons, plus bas. Tous ces champs sont obligatoires pour pouvoir créer le trajet.</div>

      <h3>Créer un trajet (étape 2 : tarifs)</h3>
      <p>Vous entrez le prix pour chaque type de billet configuré (obligatoire), ainsi que la <strong>limite de bagages</strong> en kg et les <strong>frais d'excédent</strong> par kg supplémentaire (optionnels). Une fois validé, le trajet est créé et l'application vous propose immédiatement d'ajouter un bus dessus.</p>

      <h3>La fiche d'un trajet</h3>
      <p>En cliquant sur un trajet dans la liste, une fiche s'ouvre avec 3 onglets :</p>
      <ul>
        <li><strong>Infos</strong> — prix par type, bagages, délai de présentation, PDV assignés (départ/arrêts/arrivée), détail des arrêts et des prix par tronçon.</li>
        <li><strong>Bus</strong> — la liste des bus qui circulent sur ce trajet (voir l'aide "Bus & Sessions" pour la gestion détaillée).</li>
        <li><strong>Actions</strong> — modifier, activer/désactiver, ou supprimer le trajet.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/fiche-trajet.png" alt="Exemple de la fiche détaillée d'un trajet" class="guide-img">
        <span class="guide-img-caption">Exemple de la fiche trajet avec ses 3 onglets</span>
      </div>

      <p><strong>Modifier un trajet</strong> — vous pouvez changer les prix, les PDV assignés, les arrêts et leurs prix. Si vous retirez un PDV ou un arrêt déjà utilisé pour des ventes, une confirmation détaillée s'affiche pour vous prévenir de l'impact avant validation.</p>

      <div class="guide-warning-box">⚠️ Désactiver ou supprimer un trajet retire immédiatement l'accès à la vente pour tous les PDV assignés, et supprime toutes les sessions futures des bus de ce trajet. Les réservations déjà existantes ne sont pas annulées automatiquement — vous devrez les réaffecter ou les annuler via la fenêtre de résolution qui s'affiche si des réservations bloquent l'action. L'historique (trajet, bus, sessions passées) est conservé 1 an.</div>
    `
  },
  bus: {
    title: 'Bus & Sessions',
    content: `
      <p>Cette page couvre la gestion de vos <strong>véhicules</strong> et de leurs <strong>sessions</strong> (les départs concrets, jour par jour). Pour la création et la configuration des trajets eux-mêmes (lignes, prix, arrêts, PDV), consultez l'aide de l'onglet "Trajets".</p>

      <h3>La flotte de bus (véhicules)</h3>
      <p>Un véhicule (bus) est créé une seule fois dans l'onglet <strong>"Flotte de bus"</strong>, avec son nom/immatriculation, son type (Standard, VIP, Climatisé, VIP Climatisé), sa capacité et éventuellement son chauffeur. Ce véhicule existe indépendamment des trajets : vous pouvez ensuite l'assigner à un ou plusieurs trajets.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/flotte-bus.png" alt="Exemple de la liste de la flotte de bus" class="guide-img">
        <span class="guide-img-caption">Exemple de la page Flotte de bus</span>
      </div>

      <h3>Ajouter un bus sur un trajet</h3>
      <p>Depuis l'onglet "Bus" de la fiche d'un trajet, vous choisissez un véhicule de la flotte (un véhicule déjà assigné à ce trajet ne peut pas être sélectionné deux fois), puis vous définissez l'<strong>heure de départ</strong>, l'heure d'arrivée (optionnelle, la durée se calcule automatiquement), et les <strong>jours de circulation</strong> (tous les jours ou jours précis). Si le trajet a des arrêts, vous cochez ceux que ce bus dessert réellement — un bus peut desservir moins d'arrêts qu'un autre sur le même trajet.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/ajout-bus.png" alt="Exemple de l'ajout d'un bus sur un trajet" class="guide-img">
        <span class="guide-img-caption">Exemple du formulaire d'ajout d'un bus</span>
      </div>

      <h3>Les sessions</h3>
      <p>Une fois un bus ajouté, l'application <strong>génère automatiquement les sessions</strong> (les départs concrets à venir, jour par jour, sur les 14 prochains jours selon les jours de circulation choisis). Cette génération se relance aussi automatiquement chaque nuit pour tous les bus actifs, afin de garder 14 jours de sessions disponibles en permanence. Seules les sessions à venir sont affichées dans la liste — l'historique reste consultable ailleurs pendant 1 an.</p>

      <p>Sur une session précise, vous pouvez :</p>
      <ul>
        <li><strong>La modifier</strong> — pour ce jour-là uniquement (heure de départ, heure d'arrivée, durée, arrêts actifs), sans toucher aux autres jours. Impossible si la session est déjà annulée.</li>
        <li><strong>Signaler un incident</strong> — panne, chauffeur absent, accident ou autre, avec détails optionnels. La session passe en statut "Annulée" et n'est plus vendable.</li>
        <li><strong>La supprimer</strong> — retire uniquement cette session précise (différent de supprimer le bus entier).</li>
      </ul>

      <div class="guide-warning-box">⚠️ Signaler un incident annule la session, mais <strong>n'annule pas automatiquement les réservations déjà faites dessus</strong>. Les voyageurs concernés restent inscrits — il faut ensuite traiter ces réservations séparément : les réaffecter vers un autre bus ou les annuler.</div>

      <p><strong>Gérer les réservations d'une session</strong> (après un incident, ou quand le bus concerné va être désactivé/supprimé) — deux options s'offrent à vous :</p>
      <ul>
        <li><strong>Réaffecter</strong> vers un autre bus du même trajet, à la même date. Si ce bus n'a pas encore de session ce jour-là, elle est créée automatiquement. La capacité est vérifiée arrêt par arrêt sur tout le trajet : si elle est insuffisante quelque part, la réaffectation est refusée et vous êtes averti.</li>
        <li><strong>Annuler toutes les réservations</strong> de la session — le remboursement de chaque réservation est calculé selon la politique d'annulation de l'agence (définie dans "Mon agence").</li>
      </ul>
      <p>C'est exactement ce même mécanisme qui s'affiche automatiquement dans la fenêtre de résolution des réservations bloquantes ci-dessous, lorsque des réservations existent sur des sessions futures concernées.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/sessions-bus.png" alt="Exemple de la liste des sessions d'un bus" class="guide-img">
        <span class="guide-img-caption">Exemple des sessions générées pour un bus</span>
      </div>

      <h3>Désactiver ou supprimer un bus / un véhicule</h3>
      <p>Si le bus concerné vient de la flotte, l'application vous demande la <strong>portée de l'action</strong> : seulement sur ce trajet, ou sur tous les trajets où ce véhicule circule.</p>

      <div class="guide-warning-box">⚠️ Si des réservations existent déjà sur des sessions futures concernées par la suppression ou la désactivation, une fenêtre de résolution s'ouvre automatiquement : vous devez réaffecter chaque réservation vers un autre bus disponible (ou tout réaffecter en un clic s'il existe un bus commun), ou annuler les réservations concernées, avant que l'action ne puisse se terminer.</div>

      <div class="guide-img-wrap">
        <img src="image-helps/resolution-reservations.png" alt="Exemple de la fenêtre de résolution des réservations bloquantes" class="guide-img">
        <img src="image-helps/resolution-reservations-reso.png" alt="Exemple de la fenêtre de résolution des réservations bloquantes" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre de résolution des réservations bloquantes</span>
      </div>
    `
  },
  finances: {
    title: 'Finances',
    content: `
      <p>La page Finances est le tableau de bord financier de votre réseau : elle combine les revenus des <strong>billets</strong> et des <strong>colis</strong>, avec des filtres avancés, des classements par PDV et par trajet, et un suivi des pertes de revenus (annulations, modifications, retraits).</p>

      <p><strong>Filtres de période :</strong> Aujourd'hui / Semaine / Mois / Tout, ou une <strong>période précise</strong>. Par défaut, la page s'ouvre sur "Semaine".</p>

      <div class="guide-warning-box">⚠️ Contrairement à la Vue d'ensemble (page d'accueil), qui ne montre que le jour même, Finances vous permet d'analyser n'importe quelle période passée.</div>

      <p><strong>Filtres détaillés (en cascade)</strong> — Ville, PDV, Trajet, Bus, Statut (Toutes ventes / Confirmées / Annulées), et une case à cocher "Avec retrait passager". Comme sur la page Réservations, choisir une ville filtre ensuite les PDV, puis les trajets, puis les bus disponibles.</p>

      <p>Trois boutons : <strong>Imprimer</strong>, <strong>Rapport Travio</strong> (export PDF complet avec tous les KPIs et classements) et <strong>Réinitialiser les filtres</strong>.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/filtres-reservations.png" alt="Exemple des filtres finances" class="guide-img">
        <span class="guide-img-caption">Exemple des filtres de période et des filtres détaillés</span>
      </div>

      <p><strong>Trois onglets :</strong> Vue d'ensemble, Billets, Colis.</p>

      <h3>Onglet Vue d'ensemble</h3>
      <p>Un résumé combiné de toute l'activité financière sur la période choisie :</p>
      <ul>
        <li><strong>CA total combiné</strong> — revenus billets + revenus colis, mis en avant.</li>
        <li><strong>Encaissé billets</strong> et <strong>Revenu colis</strong> — le détail des deux sources.</li>
        <li><strong>Réservations</strong> — nombre total sur la période (annulées comptabilisées séparément).</li>
      </ul>
      <p>Un encart <strong>trophée</strong> met en avant le PDV le plus rentable de la période, s'il y a des ventes.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/finances-overview-stats.png" alt="Exemple des KPIs de l'onglet Vue d'ensemble" class="guide-img">
        <span class="guide-img-caption">Exemple des cartes CA combiné, encaissé billets, revenu colis, réservations</span>
      </div>

      <h4>Impact sur vos revenus</h4>
      <p>Ce bloc répond à une question simple : <strong>combien avez-vous perdu, et combien avez-vous récupéré ?</strong> Il analyse 3 sources de perte, indépendamment du filtre "Statut" choisi plus haut :</p>
      <ul>
        <li><strong>Annulations</strong> — montant total des réservations annulées sur la période, avec le nombre de réservations et de passagers concernés.</li>
        <li><strong>Modifications</strong> — total des baisses de prix suite à une modification de réservation (ex : changement de ville de descente moins cher).</li>
        <li><strong>Retraits passagers</strong> — montant remboursé suite au retrait individuel d'un passager d'une réservation multi-passagers.</li>
        <li><strong>Frais retenus</strong> — la part de ces annulations/retraits que votre agence a gardée (selon votre politique d'annulation définie dans "Mon agence").</li>
      </ul>
      <p>En bas du bloc : le <strong>revenu net perdu</strong> (ce qui a été remboursé aux clients) et le <strong>montant récupéré en frais</strong> (ce que vous avez gardé).</p>

      <div class="guide-img-wrap">
        <img src="image-helps/finances-impact.png" alt="Exemple du bloc impact sur les revenus" class="guide-img">
        <span class="guide-img-caption">Exemple du détail annulations / modifications / retraits / frais retenus</span>
      </div>

      <div class="guide-warning-box">⚠️ Ce bloc se base sur la <strong>date de l'événement</strong> (date d'annulation, de modification ou de retrait), pas sur la date de création de la réservation. Une réservation créée le mois dernier mais annulée aujourd'hui apparaît dans l'impact d'aujourd'hui.</div>

      <h3>Onglet Billets</h3>
      <p>L'analyse détaillée des ventes de billets :</p>
      <ul>
        <li><strong>Billets vendus</strong>, <strong>Prix moyen par billet</strong>, <strong>Taux d'annulation</strong> — avec comparaison automatique à la période précédente équivalente (ex : cette semaine vs semaine dernière).</li>
      </ul>

      <p><strong>Ventes jour par jour</strong> — un graphique qui s'adapte à la période choisie : par heure si "Aujourd'hui", par jour si "Semaine" ou période précise courte, par semaine si "Mois", par mois si "Tout" ou période précise longue. <strong>Cliquer sur une barre</strong> (jour ou semaine) ouvre le détail des ventes de ce jour précis, passager par passager.</p>

      <p><strong>Quel jour vend-on le plus ?</strong> — répartition du chiffre d'affaires par jour de la semaine (Lundi à Dimanche), toutes dates confondues sur la période, avec le meilleur jour mis en évidence.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/finances-evolution-dow.png" alt="Exemple des graphiques évolution et jour de la semaine" class="guide-img">
        <span class="guide-img-caption">Exemple des graphiques "Ventes jour par jour" et "Quel jour vend-on le plus"</span>
      </div>

      <h4>Ventes par point de vente</h4>
      <p>Classement de vos PDV du plus au moins rentable, regroupés par ville, avec médailles pour le top 3. Chaque PDV affiche son CA, ses billets vendus, ses réservations, et un <strong>taux de remplissage moyen</strong> (calculé en tâche de fond). <strong>Cliquer sur un PDV</strong> ouvre son détail complet : revenus, billets, trajet le plus vendu, taux de remplissage par trajet, puis par bus (en cliquant sur un trajet), et les 5 dernières ventes.</p>

      <h4>Trajets les plus rentables</h4>
      <p>Classement de vos trajets du plus au moins rentable. <strong>Cliquer sur un trajet</strong> ouvre son détail : revenus, billets, meilleur jour de vente, <strong>remplissage réel par bus</strong> (tous PDV confondus, contrairement à la vue par PDV qui isole un seul PDV), et la liste des PDV ayant vendu sur ce trajet.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/finances-pdv-trajets-list.png" alt="Exemple des classements PDV et trajets" class="guide-img">
        <img src="image-helps/finances-detail-pdv.png" alt="Exemple du détail d'un PDV" class="guide-img">
        <span class="guide-img-caption">Exemple des classements, et du panneau de détail ouvert après un clic</span>
      </div>

      <div class="guide-warning-box">⚠️ La différence entre le détail "PDV → trajet → bus" et le détail "Trajet → bus" : le premier montre combien CE PDV précis a vendu sur chaque bus, le second montre le remplissage réel du bus tous PDV confondus.</div>

      <h3>Onglet Colis</h3>
      <p>Le suivi des revenus liés à l'expédition de colis (l'expédition elle-même se fait uniquement côté PDV, cette page n'affiche que les statistiques) :</p>
      <ul>
        <li><strong>Revenu colis</strong>, <strong>Total colis</strong> (avec prix moyen), <strong>En transit</strong>, <strong>Arrivés</strong>, <strong>Retirés</strong> — les 3 derniers correspondant aux statuts du cycle de vie d'un colis.</li>
        <li><strong>Expéditions jour par jour</strong> et <strong>Quel jour expédie-t-on le plus</strong> — mêmes logiques de graphique que pour les billets.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/finances-colis.png" alt="Exemple de l'onglet Colis" class="guide-img">
        <span class="guide-img-caption">Exemple des statistiques de l'onglet Colis</span>
      </div>

      <div class="guide-warning-box">⚠️ Tous les graphiques et classements respectent les filtres actifs (ville, PDV, trajet, bus, statut) — sauf le bloc "Impact sur vos revenus", qui ignore volontairement le filtre Statut puisqu'il analyse justement les annulations et modifications.</div>
    `
  },
  equipe: {
    title: 'Équipe',
    content: `
      <p>La page Équipe centralise la gestion de vos <strong>points de vente</strong>, de vos <strong>contrôleurs</strong> et de vos <strong>chauffeurs</strong>. Trois onglets en haut de la page séparent ces trois rôles, qui n'ont pas les mêmes droits ni la même interface.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/equipe-onglets.png" alt="Exemple des 3 onglets de la page Équipe" class="guide-img">
        <span class="guide-img-caption">Exemple des onglets Points de vente / Contrôleurs / Chauffeurs</span>
      </div>

      <h3>Onglet Points de vente (PDV)</h3>
      <p>Un PDV est un <strong>compte agent</strong> qui peut se connecter à sa propre interface pour vendre des billets, uniquement sur les trajets qui lui ont été assignés (voir l'aide de la page "Trajets" pour la logique d'assignation).</p>

      <p>Les PDV sont regroupés par <strong>ville</strong>. Si une ville a plus de 4 PDV, seuls les 4 premiers s'affichent avec un lien "Voir tout →" pour ouvrir la liste complète.</p>

      <p><strong>3 indicateurs en haut de la liste</strong> (calculés en tâche de fond) :</p>
      <ul>
        <li><strong>PDV actifs</strong> — combien de PDV sur le total peuvent se connecter.</li>
        <li><strong>À surveiller</strong> — nombre de PDV actifs sans aucune vente depuis 5 jours ou plus. Un clic sur cette carte filtre directement la liste sur ces PDV.</li>
        <li><strong>Revenu réseau (mois)</strong> — somme des revenus du mois en cours, tous PDV confondus.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/equipe-pdv-stats-bar.png" alt="Exemple de la barre de stats PDV" class="guide-img">
        <span class="guide-img-caption">Exemple des 3 cartes de stats en haut de la liste PDV</span>
      </div>

      <h4>La carte d'un PDV</h4>
      <p>Chaque carte affiche : le nom du responsable, son téléphone, le nombre de trajets assignés, la <strong>date de sa dernière vente</strong>, et 3 chiffres du mois en cours — billets vendus, taux de vente (remplissage moyen), et revenu généré.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/equipe-pdv-carte.png" alt="Exemple d'une carte PDV" class="guide-img">
        <span class="guide-img-caption">Exemple d'une carte PDV avec ses statistiques du mois</span>
      </div>

      <h4>Créer un PDV (2 étapes)</h4>
      <p><strong>Étape 1 — Localisation :</strong> ville (liste de villes prédéfinies + option "Autre..."), nom du point de vente, adresse/quartier, téléphone du responsable.</p>
      <p><strong>Étape 2 — Accès agent :</strong> nom du responsable, email personnel (optionnel), <strong>email de connexion</strong> et <strong>mot de passe</strong> (minimum 6 caractères) — ce sont les identifiants que l'agent utilisera pour se connecter à son interface de vente.</p>

      <div class="guide-warning-box">⚠️ L'email de connexion et le mot de passe créés ici sont les identifiants du compte agent. Notez-les avant de valider — vous pourrez les consulter/modifier plus tard, mais transmettez-les à votre agent de façon sécurisée.</div>

      <h4>Le détail d'un PDV (clic sur une carte)</h4>
      <p>Deux onglets s'ouvrent :</p>
      <ul>
        <li><strong>Infos</strong> — coordonnées complètes, email de connexion, et le mot de passe (masqué par défaut, avec un bouton "œil" pour le révéler temporairement — il se remasque automatiquement après 10 secondes).</li>
        <li><strong>Trajets</strong> — la liste des trajets assignés à ce PDV, avec son rôle sur chacun (Départ ou Arrêt intermédiaire), le nombre de bus actifs et leurs jours de circulation.</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/equipe-pdv-detail.png" alt="Exemple du détail d'un PDV" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau de détail avec les onglets Infos et Trajets</span>
      </div>

      <p><strong>4 actions possibles</strong> depuis le détail : Modifier les infos, Réinitialiser le mot de passe, Activer/Désactiver le PDV, Supprimer le PDV.</p>

      <div class="guide-warning-box">⚠️ <strong>Désactiver</strong> un PDV empêche l'agent de se connecter, mais ne touche pas à ses réservations existantes — c'est réversible. <strong>Supprimer</strong> un PDV est irréversible et supprime aussi le compte agent associé.</div>

      <h3>Onglet Contrôleurs</h3>
      <p>Cette fonctionnalité est en cours de développement et <strong>n'est pas encore active</strong> — la page affiche un message "Bientôt disponible". Une fois disponible, elle permettra de créer des comptes contrôleurs, de les assigner à un bus précis, et de suivre en temps réel leurs scans de billets à bord.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/equipe-controleurs-soon.png" alt="Exemple de l'onglet Contrôleurs à venir" class="guide-img">
        <span class="guide-img-caption">Exemple de l'écran "Bientôt disponible" de l'onglet Contrôleurs</span>
      </div>

      <h3>Onglet Chauffeurs</h3>
      <p>Contrairement aux PDV, les chauffeurs <strong>ne sont pas créés depuis cette page</strong> : ils sont renseignés lors de la création ou de la modification d'un bus, depuis "Trajets & Bus → Flotte de bus". Cette page affiche uniquement la liste de vos chauffeurs (regroupés automatiquement s'ils conduisent plusieurs bus) et permet de partager leur accès.</p>

      <p><strong>Partager le lien d'accès</strong> — un lien unique est généré <strong>pour toute l'agence</strong> (pas un par chauffeur). Ce lien ouvre une page autonome où le chauffeur peut, en entrant le code inscrit sur un colis, le marquer comme <strong>arrivé</strong> à destination, puis comme <strong>retiré</strong> (avec le nom du retirant et sa pièce d'identité). C'est utile uniquement pour les colis déposés à un <strong>arrêt sans PDV</strong> (un simple point de repère), où personne d'autre ne peut mettre à jour le statut.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/equipe-chauffeurs-liste.png" alt="Exemple de la liste des chauffeurs" class="guide-img">
        <span class="guide-img-caption">Exemple de la liste des chauffeurs et du bouton de partage du lien</span>
      </div>

      <div class="guide-warning-box">⚠️ Le lien d'accès chauffeur n'est pas nominatif : c'est le même lien pour tous les chauffeurs de l'agence, à envoyer une seule fois. Il ne nécessite aucune connexion ni mot de passe — seul le lien complet (avec son jeton) donne l'accès.</div>
    `
  },
  'connexion-partenaires': {
    title: 'Connexion PDV & Chauffeur',
    content: `
      <p>Vos PDV et vos chauffeurs n'utilisent pas la même porte d'entrée que vous. Voici exactement ce qu'il faut leur indiquer.</p>

      <h3>Se connecter en tant que PDV</h3>
      <p>Un PDV se connecte avec l'<strong>email de connexion</strong> et le <strong>mot de passe</strong> que vous avez définis à sa création (visibles et modifiables depuis l'onglet "Points de vente" → détail du PDV).</p>

      <p><strong>Étape 1</strong> — Ouvrir la page d'accueil de connexion Travio (la même URL que celle que vous utilisez pour vous connecter au siège).</p>

      <div class="guide-img-wrap">
        <img src="image-helps/connexion-accueil.png" alt="Exemple de la page d'accueil de connexion" class="guide-img">
        <span class="guide-img-caption">Exemple de la page d'accueil, avec le bloc "accès partenaire" tout en bas</span>
      </div>

      <p><strong>Étape 2</strong> — Tout en bas de la page, sous la section "accès partenaire", cliquer sur le bouton <strong>"Accès Point de vente"</strong>.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/connexion-bouton-pdv.png" alt="Exemple du bouton Accès Point de vente" class="guide-img">
        <span class="guide-img-caption">Exemple du bouton "Accès Point de vente" sur la page d'accueil</span>
      </div>

      <p><strong>Étape 3</strong> — Entrer l'email de connexion et le mot de passe fournis par le siège, puis cliquer sur "Accéder à mon espace".</p>

      <div class="guide-img-wrap">
        <img src="image-helps/connexion-form-pdv.png" alt="Exemple du formulaire de connexion PDV" class="guide-img">
        <span class="guide-img-caption">Exemple de l'écran de connexion Point de vente</span>
      </div>

      <div class="guide-warning-box">⚠️ Si l'appareil est déjà connecté à un compte siège (administrateur), il faut d'abord se déconnecter avant de pouvoir se connecter en tant que PDV. Depuis le tableau de bord, cliquez sur le bouton <strong>"Se déconnecter"</strong> en bas de la barre latérale (l'icône à côté de votre nom), vous serez ramené à la page d'accueil — il suffit ensuite de suivre les étapes 2 et 3 ci-dessus.</div>

      <div class="guide-img-wrap">
        <img src="image-helps/connexion-deconnexion-siege.png" alt="Exemple du bouton de déconnexion" class="guide-img">
        <span class="guide-img-caption">Exemple du bouton "Se déconnecter" dans la barre latérale du siège</span>
      </div>

      <h3>Se connecter en tant que chauffeur</h3>
      <p>Contrairement au PDV, le chauffeur <strong>n'a ni email ni mot de passe</strong> à retenir. Il utilise un simple <strong>lien direct</strong>, le même pour tous les chauffeurs de l'agence, qui ouvre directement l'écran de gestion des colis — sans aucune connexion à faire.</p>

      <p>Ce lien est à envoyer une seule fois depuis l'onglet "Chauffeurs" de la page Équipe, via le bouton <strong>"Partager le lien d'accès"</strong> (envoi direct par WhatsApp).</p>

      <div class="guide-img-wrap">
        <img src="image-helps/connexion-partage-lien-chauffeur.png" alt="Exemple du bouton de partage du lien chauffeur" class="guide-img">
        <span class="guide-img-caption">Exemple du bouton "Partager le lien d'accès" dans l'onglet Chauffeurs</span>
      </div>

      <p>Une fois le lien ouvert, le chauffeur arrive directement sur un écran où il n'a qu'à <strong>entrer le code inscrit sur l'étiquette du colis</strong> pour le marquer comme arrivé ou retiré.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/connexion-ecran-chauffeur.png" alt="Exemple de l'écran d'accès chauffeur" class="guide-img">
        <span class="guide-img-caption">Exemple de l'écran que voit le chauffeur après ouverture du lien</span>
      </div>

      <div class="guide-warning-box">⚠️ Ce lien contient un jeton de sécurité propre à votre agence — ne le partagez qu'avec vos propres chauffeurs. S'il est un jour compromis, il faudra en régénérer un nouveau (fonctionnalité à venir), ce qui invalidera l'ancien.</div>
    `
  },
  agence: {
    title: 'Mon agence',
    content: `
      <p>Cette page est la <strong>vitrine publique</strong> de votre agence : c'est ce que verront vos voyageurs (nom, logo, photos, description, règles, politique d'annulation). C'est aussi ici que se configurent deux réglages qui influencent tout le reste de l'application : le <strong>délai de présentation</strong> et la <strong>politique d'annulation</strong>.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/agence-hero.png" alt="Exemple de la fiche agence affichée" class="guide-img">
        <span class="guide-img-caption">Exemple de la fiche agence : photos, logo, nom, slogan, coordonnées</span>
      </div>

      <h3>Ce que vous voyez sur la page</h3>
      <p>En haut : une bande de <strong>photos</strong> (si vous en avez ajouté), puis votre <strong>logo</strong>, le <strong>nom</strong> de l'agence, son <strong>slogan</strong>, et une ligne de badges (ville/pays, téléphone, année de création).</p>
      <p>En dessous, une grille de cartes qui reprend chaque section renseignée : Description, Notre histoire, Pourquoi nous choisir, Nos engagements, Règles de l'agence, Politique d'annulation, Contact. <strong>Seules les sections que vous avez remplies s'affichent</strong> — une section vide n'apparaît pas du tout, plutôt que d'afficher une carte vide.</p>

      <div class="guide-warning-box">⚠️ Ces informations (description, histoire, engagements, règles) sont ce qui rassure et convainc un voyageur de choisir votre agence plutôt qu'une autre. Prenez le temps de bien les remplir.</div>

      <h3>Le bouton "Modifier"</h3>
      <p>En haut à droite, le bouton <strong>Modifier</strong> ouvre une petite fenêtre de choix avec deux options distinctes :</p>
      <ul>
        <li><strong>Modifier la fiche</strong> — toutes les informations textuelles (nom, slogan, description, contact, politique d'annulation, etc.)</li>
        <li><strong>Gérer les images</strong> — uniquement le logo et les photos.</li>
      </ul>
      <p>Ces deux actions sont séparées volontairement : changer une image ne nécessite pas de rouvrir tout le formulaire de texte, et inversement.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/agence-modifier-choix.png" alt="Exemple du choix Modifier la fiche / Gérer les images" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre de choix après un clic sur "Modifier"</span>
      </div>

      <h3>Modifier la fiche</h3>
      <p>Un long formulaire s'ouvre avec tous les champs texte. <strong>Nom, slogan, description, ville, adresse et téléphone sont obligatoires</strong> — le reste (histoire, points forts, engagements, règles, année de création) est optionnel mais recommandé.</p>
      <p>La sauvegarde est <strong>immédiate</strong> : dès que vous cliquez sur "Sauvegarder", la fiche publique est mise à jour, sans étape de validation supplémentaire.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/agence-edit-fiche.png" alt="Exemple du formulaire de modification de la fiche" class="guide-img">
        <span class="guide-img-caption">Exemple du formulaire "Modifier la fiche agence"</span>
      </div>

      <h4>Délai de présentation avant le départ</h4>
      <p>Ce champ définit combien de temps <strong>avant le départ</strong> un passager doit se présenter (ex : 30 minutes, ou 1 heure). Cette information est ensuite <strong>affichée directement sur les billets</strong> vendus par tous vos PDV et au siège — elle n'a donc besoin d'être configurée qu'une seule fois ici pour s'appliquer à toute l'agence.</p>

      <h4>Politique d'annulation</h4>
      <p>Trois choix possibles, qui déterminent ce qui se passe quand une réservation est annulée depuis la page "Réservations" :</p>
      <ul>
        <li><strong>Vente définitive — aucune annulation</strong> — aucun remboursement n'est jamais possible, quelle que soit la situation.</li>
        <li><strong>Annulation autorisée sans remboursement</strong> — le client peut annuler mais ne récupère rien ; un délai limite avant le départ peut être fixé.</li>
        <li><strong>Annulation autorisée avec remboursement</strong> — le client est remboursé, avec un délai limite avant le départ et un pourcentage de <strong>frais retenus</strong> par l'agence (ex : 20% gardés, 80% remboursés).</li>
      </ul>

      <div class="guide-warning-box">⚠️ Cette politique n'est pas juste informative : elle est utilisée <strong>en temps réel</strong> par la page Réservations pour calculer automatiquement le montant remboursé lors de chaque annulation, et par le bloc "Impact sur vos revenus" de la page Finances pour distinguer le revenu perdu des frais récupérés. La modifier ici change immédiatement le comportement de toute l'agence, y compris pour les réservations déjà existantes qui seraient annulées après ce changement.</div>

      <h3>Gérer les images</h3>
      <p>Un logo (obligatoire à la création de l'agence, modifiable ici à tout moment) et jusqu'à <strong>5 photos</strong> de l'agence. Chaque photo existante affiche un petit bouton "×" pour la marquer à supprimer, et une case "+" permet d'en ajouter de nouvelles tant que le total ne dépasse pas 5.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/agence-edit-images.png" alt="Exemple de la gestion des images" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre "Gérer les images"</span>
      </div>

      <div class="guide-warning-box">⚠️ Les suppressions et ajouts de photos ne sont appliqués qu'au clic sur "Sauvegarder les images" — vous pouvez donc annuler une suppression accidentelle en fermant la fenêtre sans sauvegarder.</div>
    `
  },
  colis: {
    title: 'Colis',
    content: `
      <p>Cette page est une <strong>vue de suivi côté siège</strong> pour tous les colis expédiés par votre réseau. <strong>L'enregistrement d'un nouveau colis se fait uniquement depuis l'interface d'un PDV</strong> — ici, vous ne pouvez que consulter, filtrer, et faire avancer le statut d'un colis déjà créé.</p>

      <div class="guide-warning-box">⚠️ Vous ne pouvez pas créer de colis depuis cette page. Si un client souhaite envoyer un colis, il doit passer par un point de vente.</div>

      <h3>Le cycle de vie d'un colis</h3>
      <p>Un colis passe toujours par 3 statuts, dans cet ordre :</p>
      <ul>
        <li><strong>En transit</strong> — le colis a été enregistré par un PDV et est en cours d'acheminement.</li>
        <li><strong>Arrivé</strong> — le colis est arrivé à destination et attend d'être retiré.</li>
        <li><strong>Retiré</strong> — le destinataire (ou une personne mandatée) a récupéré le colis. C'est un statut final.</li>
      </ul>

      <h3>Filtres de période</h3>
      <p>Aujourd'hui / Semaine / Mois / Tout, ou une <strong>période précise</strong> (deux dates). Le filtre se base sur la <strong>date de création</strong> du colis (ajustée au fuseau horaire de Brazzaville).</p>

      <h3>Filtres détaillés (en cascade)</h3>
      <p>Ville, PDV, Trajet, Bus, Statut, et une recherche libre (nom, téléphone, ou <strong>code de retrait</strong>). Comme sur les pages Réservations et Finances, choisir un trajet met à jour automatiquement la liste des bus disponibles dans le filtre correspondant.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/filtres-reservations.png" alt="Exemple des filtres de la page Colis" class="guide-img">
        <span class="guide-img-caption">Exemple des filtres de période et des filtres détaillés</span>
      </div>

      <h3>Alerte — Colis en attente de retrait</h3>
      <p>Une carte d'alerte apparaît automatiquement dès qu'au moins un colis est <strong>arrivé depuis 3 jours ou plus</strong> sans avoir été retiré. Un clic sur cette carte filtre instantanément la liste sur ces colis précis, pour vous permettre de relancer le destinataire ou de vérifier ce qui bloque.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/colis-alerte.png" alt="Exemple de l'alerte colis en attente" class="guide-img">
        <span class="guide-img-caption">Exemple de la carte d'alerte "Colis en attente de retrait"</span>
      </div>

      <h3>Les statistiques</h3>
      <p><strong>Revenu colis</strong> — total encaissé sur les colis filtrés, avec une comparaison automatique en % par rapport à la période équivalente précédente (ex : cette semaine vs semaine dernière). <strong>Total colis</strong> affiche aussi le prix moyen par colis. Les 3 dernières cartes reprennent simplement le nombre de colis dans chaque statut du cycle de vie.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/colis-stats.png" alt="Exemple des cartes de statistiques colis" class="guide-img">
        <span class="guide-img-caption">Exemple des cartes de stats en haut de la liste</span>
      </div>

      <h3>Le tableau et le détail d'un colis</h3>
      <p>Chaque ligne affiche l'expéditeur et le destinataire, le trajet emprunté, le <strong>code de retrait</strong> (à présenter pour récupérer le colis), le prix, et le statut. <strong>Cliquer sur une ligne</strong> ouvre un panneau détaillé avec toutes les informations : coordonnées complètes des deux parties, trajet, bus, points d'embarquement et de débarquement (PDV ou arrêt libre), nature du colis, poids, valeur déclarée, et remarques éventuelles.</p>

      <div class="guide-img-wrap">
        <img src="image-helps/colis-detail.png" alt="Exemple du détail d'un colis" class="guide-img">
        <span class="guide-img-caption">Exemple du panneau de détail ouvert après un clic sur un colis</span>
      </div>

      <h4>Faire avancer le statut</h4>
      <p>Depuis le détail, deux actions sont possibles selon le statut actuel :</p>
      <ul>
        <li><strong>"Marquer comme arrivé"</strong> (si le colis est en transit) — passage immédiat au statut Arrivé, sans confirmation supplémentaire.</li>
        <li><strong>"Marquer comme retiré"</strong> (si le colis est arrivé) — ouvre une fenêtre de confirmation obligatoire.</li>
      </ul>

      <h4>La confirmation de retrait</h4>
      <p>Avant de marquer un colis comme retiré, vous devez renseigner :</p>
      <ul>
        <li>Le <strong>nom de la personne</strong> qui retire le colis (qui peut être différente du destinataire initial).</li>
        <li>Le <strong>type de pièce d'identité</strong> présentée : CNI, passeport, permis de conduire, ou "Aucune pièce disponible".</li>
        <li>Selon le choix : le <strong>numéro de la pièce</strong>, ou, si aucune pièce n'est disponible, une <strong>précision obligatoire</strong> (ex : nom d'un témoin, motif).</li>
      </ul>

      <div class="guide-img-wrap">
        <img src="image-helps/colis-confirmation-retrait.png" alt="Exemple de la fenêtre de confirmation de retrait" class="guide-img">
        <span class="guide-img-caption">Exemple de la fenêtre de confirmation avant de marquer un colis comme retiré</span>
      </div>

      <div class="guide-warning-box">⚠️ Une fois un colis marqué "Retiré", ce statut est <strong>définitif</strong> — il ne peut plus être remis à "Arrivé" ou "En transit" depuis cette page. Ces informations de retrait (qui, avec quelle pièce, à quelle date) restent consultables dans le détail du colis, à des fins de traçabilité.</div>

      <h3>Le badge dans la barre latérale</h3>
      <p>Le badge rouge affiché à côté de "Colis" dans le menu correspond au nombre de colis actuellement au statut <strong>Arrivé</strong> (donc en attente de retrait) — c'est un indicateur "à surveiller", pas le nombre total de colis.</p>
    `
  },
  // Les autres pages seront ajoutées ici au fur et à mesure
};

export function openPageHelp(pageId) {
  const data = PAGE_HELP[pageId];
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