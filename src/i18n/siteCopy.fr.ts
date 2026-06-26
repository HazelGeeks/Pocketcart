import type { SiteCopy } from "./siteCopyTypes";

export const frSiteCopy: SiteCopy = {
    nav: {
      features: "Fonctionnalites",
      howItWorks: "Fonctionnement",
      faq: "FAQ",
      blog: "Blog",
      getApp: "Obtenir l app",
      downloadIos: "Telecharger sur iOS",
      downloadAndroid: "Telecharger sur Android",
      language: "Langue",
      english: "Anglais",
      french: "Francais",
    },
    hero: {
      pills: ["Promos quotidiennes", "Alertes suivi", "Vision economies"],
      titleLine1: "Economisez mieux",
      titleLine2: "Achetez mieux",
      sub:
        "Comparez les prix entre magasins, suivez vos produits et " +
        "maitrisez votre budget - dans une seule application.",
      card: {
        header: "Radar prix",
        rows: [
          { store: "Magasin A", price: "$74.20", delta: "-8%" },
          { store: "Magasin B", price: "$69.80", delta: "-12%" },
          { store: "Magasin C", price: "$72.10", delta: "-9%" },
        ],
        saving: "Vous pouvez economiser jusqu a 92 $/mois",
      },
    },
    features: {
      eyebrow: "FONCTIONNALITES",
      titleLine1: "Tout ce qu il faut",
      titleLine2: "pour economiser facilement",
      sub:
        "Quatre modules travaillent ensemble pour passer moins de " +
        "temps a chercher et plus de temps a economiser.",
      cards: [
        {
          title: "Carte des prix",
          body:
            "Comparez instantanement plusieurs magasins et reperez la " +
            "meilleure offre sans effort manuel.",
        },
        {
          title: "Suivi intelligent",
          body:
            "Ajoutez vos produits preferes et recevez une alerte des " +
            "que le prix passe sous votre objectif.",
        },
        {
          title: "Planificateur budget",
          body:
            "Visualisez vos economies mensuelles et annuelles avec " +
            "une projection claire avant et apres.",
        },
        {
          title: "Alertes de baisse",
          body:
            "Ne manquez plus une promo. Les notifications arrivent " +
            "des qu un article suivi atteint votre prix.",
        },
      ],
    },
    how: {
      eyebrow: "FONCTIONNEMENT",
      titleLine1: "Trois etapes simples",
      titleLine2: "pour mieux acheter",
      steps: [
        {
          num: "01",
          title: "Rechercher",
          body:
            "Trouvez un produit par nom ou categorie - notre base " +
            "couvre les principales enseignes.",
        },
        {
          num: "02",
          title: "Comparer",
          body:
            "Comparez les prix cote a cote, classes par valeur. " +
            "La meilleure offre ressort immediatement.",
        },
        {
          num: "03",
          title: "Economiser",
          body:
            "Suivez vos gains dans le temps et voyez vos economies " +
            "progresser mois apres mois.",
        },
      ],
      stats: [
        { label: "Ecart moyen article", value: "6,40 $" },
        { label: "Economies mensuelles", value: "92 $" },
        { label: "Economies annuelles", value: "1 104 $" },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Reponses aux questions frequentes",
      items: [
        {
          q: "Faut-il un compte pour comparer les prix ?",
          a:
            "Non. Vous pouvez comparer tout de suite. Le compte est " +
            "utile pour synchroniser suivi et budget entre appareils.",
        },
        {
          q: "A quelle frequence les prix sont-ils mis a jour ?",
          a:
            "Les articles populaires sont rafraichis regulierement et " +
            "les produits suivis sont verifies sur un cycle continu.",
        },
        {
          q: "Puis-je utiliser PocketCart sur mobile et web ?",
          a:
            "Oui. Vos donnees restent synchronisees sur iOS, Android " +
            "et web avec le meme compte.",
        },
      ],
    },
    cta: {
      eyebrow: "PRET ?",
      titleLine1: "Commencez a economiser",
      titleLine2: "des aujourd hui",
      sub:
        "Telechargez PocketCart et reprenez le controle de vos " +
        "achats. Disponible sur iOS et Android - gratuit au depart.",
    },
    footer: {
      tagline: "De meilleures habitudes d achat, simplifiees.",
      signupTitle: "Recevez le lancement",
      signupSub:
        "Entrez votre e-mail pour etre informe en premier quand " +
        "PocketCart sera disponible.",
      signupDone: "Inscription validee. Nous vous informerons bientot.",
      emailPlaceholder: "Entrez votre e-mail",
      notify: "Me notifier",
      copyright: "© 2026 PocketCart. Tous droits reserves.",
      groups: [
        {
          title: "Produit",
          links: [
            { id: "features", label: "Fonctionnalites" },
            { id: "pricing", label: "Tarifs" },
            { id: "faq", label: "FAQ" },
            { id: "roadmap", label: "Feuille de route" },
          ],
        },
        {
          title: "Societe",
          links: [
            { id: "about", label: "A propos" },
            { id: "blog", label: "Blog" },
          ],
        },
        {
          title: "Legal",
          links: [
            { id: "privacy", label: "Confidentialite" },
            { id: "terms", label: "Conditions" },
            { id: "support", label: "Assistance" },
            { id: "delete-account", label: "Suppression compte" },
          ],
        },
      ],
    },
    blog: {
      back: "Retour accueil",
      backToBlog: "Retour au blog",
      eyebrow: "BLOG",
      title: "Journal PocketCart",
      sub:
        "Conseils, mises a jour produit et strategies d achat " +
        "pour economiser plus chaque mois.",
      readArticle: "Lire l article",
      featuredLabel: "Article a la une",
      latestLabel: "Derniers articles",
      relatedPosts: "Articles lies",
      minutesRead: "min lecture",
      posts: [
        {
          title: "Creer une meilleure liste de suivi courses",
          date: "20 fevrier 2026",
          body:
            "Une methode pratique pour suivre les essentiels, " +
            "definir des cibles realistes et capter les promos.",
        },
        {
          title: "Le cout cache d un achat sans comparaison",
          date: "12 fevrier 2026",
          body:
            "Pourquoi de petits ecarts s accumulent vite et comment " +
            "une habitude hebdomadaire permet de mieux economiser.",
        },
        {
          title: "Acheter avec une strategie budget",
          date: "30 janvier 2026",
          body:
            "Apprenez a fixer des plafonds, prioriser l essentiel et " +
            "garder vos depenses alignees avec vos objectifs.",
        },
      ],
    },
    legal: {
      backToHome: "Retour accueil",
      englishOnly: "Cette page legale est actuellement disponible en anglais.",
      privacyTitle: "Politique de confidentialite",
      termsTitle: "Conditions d utilisation",
      lastUpdated: "Mise a jour",
    },
    mvp: {
      eyebrow: "MVP",
      title: "Prototype application PocketCart",
      sub:
        "Ce prototype couvre la connexion, le suivi des articles, " +
        "l historique des prix, les alertes et les etats UX de base.",
      backToHome: "Retour accueil",
      auth: {
        title: "Compte",
        sub: "Connectez-vous ou creez un compte pour garder vos donnees.",
        emailLabel: "E-mail",
        passwordLabel: "Mot de passe",
        signIn: "Se connecter",
        signUp: "Creer un compte",
        signOut: "Se deconnecter",
        demoHint:
          "Conseil: creez un compte puis reconnectez-vous avec les " +
          "memes identifiants lors de la prochaine session.",
        welcomePrefix: "Connecte comme",
      },
      compliance: {
        title: "Confiance et conformite",
        sub:
          "Ces liens et controles couvrent les attentes de review " +
          "sur la confidentialite, les conditions et la suppression.",
        privacy: "Politique de confidentialite",
        terms: "Conditions d utilisation",
        deletionPortal: "Portail suppression de compte",
        deletionPortalHint:
          "Google Play exige aussi une URL externe de suppression.",
        openWebDeletion: "Ouvrir le portail web",
        deleteAccount: "Supprimer mon compte",
        deleteAccountConfirm: "Confirmer suppression du compte",
        cancelDelete: "Annuler",
      },
      deletePage: {
        title: "Suppression de compte",
        intro:
          "Cette page sert de ressource externe de suppression " +
          "requise pour Google Play.",
        inAppTitle: "Supprimer dans l application",
        inAppBody:
          "Ouvrez l onglet More dans l application iOS ou Android, " +
          "puis choisissez Account deletion dans les reglages du compte.",
        webTitle: "Supprimer via demande web",
        webBody:
          "Si vous ne pouvez pas ouvrir l application, utilisez " +
          "la page d assistance PocketCart avec votre e-mail de compte.",
        urlLabel: "URL de suppression",
        retainedTitle: "Donnees conservees apres suppression",
        retainedBody:
          "Le profil, la watchlist et les preferences liees au compte sont " +
          "supprimes sauf conservation requise pour securite, fraude ou loi.",
        supportTitle: "Assistance",
        supportBody:
          "Si la suppression echoue, ouvrez https://pocketcart.pages.dev/support " +
          "avec votre e-mail de compte et la plateforme.",
      },
      items: {
        title: "Articles suivis",
        formTitle: "Ajouter un article",
        nameLabel: "Nom du produit",
        storeLabel: "Magasin",
        targetLabel: "Prix cible",
        latestLabel: "Prix actuel",
        sourceLabel: "Source",
        addButton: "Ajouter",
        empty: "Aucun article suivi. Ajoutez votre premier article.",
        updateButton: "Enregistrer prix",
        deleteButton: "Supprimer",
        latestTag: "Actuel",
        targetTag: "Cible",
      },
      history: {
        title: "Historique des prix",
        emptyItems: "Ajoutez un article pour demarrer l historique.",
        emptyRows: "Pas encore d historique pour cet article.",
        selectItem: "Selectionner un article",
        sourceFallback: "mise a jour manuelle",
      },
      notifications: {
        title: "Notifications",
        empty: "Aucune notification pour le moment.",
        markAllRead: "Tout marquer comme lu",
        alertsEnabled: "Alertes actives",
        alertsDisabled: "Alertes inactives",
        unreadLabel: "Non lues",
      },
      states: {
        loading: "Chargement de votre espace MVP local...",
        saving: "Enregistrement en cours...",
        signedIn: "Connexion reussie.",
        signedUp: "Compte cree et connexion reussie.",
        signedOut: "Vous etes deconnecte.",
        accountDeleted: "Compte et donnees associees supprimes.",
        deletePending:
          "Appuyez sur confirmer pour supprimer ce compte definitivement.",
        itemAdded: "Article ajoute au suivi.",
        itemDeleted: "Article supprime du suivi.",
        priceRecorded: "Prix enregistre.",
        alertsUpdated: "Preference d alerte mise a jour.",
        notificationsRead: "Notifications marquees comme lues.",
        unknownError: "Une erreur est survenue. Reessayez.",
        validation: {
          emailRequired: "L e-mail est requis.",
          passwordRequired: "Le mot de passe est requis.",
          passwordTooShort: "Le mot de passe doit faire 4 caracteres minimum.",
          accountExists: "Cet e-mail existe deja.",
          invalidCredentials: "E-mail ou mot de passe invalide.",
          authRequired: "Connectez-vous d abord.",
          nameRequired: "Le nom du produit est requis.",
          storeRequired: "Le magasin est requis.",
          targetInvalid: "Le prix cible doit etre superieur a 0.",
          priceInvalid: "Le prix doit etre superieur a 0.",
          itemMissing: "Article introuvable. Rechargez puis reessayez.",
          busy: "Veuillez attendre la fin de l action en cours.",
        },
      },
    },
};
