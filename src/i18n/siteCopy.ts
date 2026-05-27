import type { Locale } from "./types";

type FeatureCard = {
  title: string;
  body: string;
};

type HowStep = {
  num: string;
  title: string;
  body: string;
};

type Stat = {
  label: string;
  value: string;
};

type FaqItem = {
  q: string;
  a: string;
};

type FooterLink = {
  id: string;
  label: string;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

type BlogPost = {
  title: string;
  date: string;
  body: string;
};

export type SiteCopy = {
  nav: {
    features: string;
    howItWorks: string;
    faq: string;
    blog: string;
    getApp: string;
    downloadIos: string;
    downloadAndroid: string;
    language: string;
    english: string;
    french: string;
  };
  hero: {
    pills: string[];
    titleLine1: string;
    titleLine2: string;
    sub: string;
    card: {
      header: string;
      rows: Array<{ store: string; price: string; delta: string }>;
      saving: string;
    };
  };
  features: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    sub: string;
    cards: FeatureCard[];
  };
  how: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    steps: HowStep[];
    stats: Stat[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: FaqItem[];
  };
  cta: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    sub: string;
  };
  footer: {
    tagline: string;
    signupTitle: string;
    signupSub: string;
    signupDone: string;
    emailPlaceholder: string;
    notify: string;
    copyright: string;
    groups: FooterGroup[];
  };
  blog: {
    back: string;
    backToBlog: string;
    eyebrow: string;
    title: string;
    sub: string;
    readArticle: string;
    featuredLabel: string;
    latestLabel: string;
    relatedPosts: string;
    minutesRead: string;
    posts: BlogPost[];
  };
  legal: {
    backToHome: string;
    englishOnly: string;
    privacyTitle: string;
    termsTitle: string;
    lastUpdated: string;
  };
  mvp: {
    eyebrow: string;
    title: string;
    sub: string;
    backToHome: string;
    auth: {
      title: string;
      sub: string;
      emailLabel: string;
      passwordLabel: string;
      signIn: string;
      signUp: string;
      signOut: string;
      demoHint: string;
      welcomePrefix: string;
    };
    compliance: {
      title: string;
      sub: string;
      privacy: string;
      terms: string;
      deletionPortal: string;
      deletionPortalHint: string;
      openWebDeletion: string;
      deleteAccount: string;
      deleteAccountConfirm: string;
      cancelDelete: string;
    };
    deletePage: {
      title: string;
      intro: string;
      inAppTitle: string;
      inAppBody: string;
      webTitle: string;
      webBody: string;
      urlLabel: string;
      retainedTitle: string;
      retainedBody: string;
      supportTitle: string;
      supportBody: string;
    };
    items: {
      title: string;
      formTitle: string;
      nameLabel: string;
      storeLabel: string;
      targetLabel: string;
      latestLabel: string;
      sourceLabel: string;
      addButton: string;
      empty: string;
      updateButton: string;
      deleteButton: string;
      latestTag: string;
      targetTag: string;
    };
    history: {
      title: string;
      emptyItems: string;
      emptyRows: string;
      selectItem: string;
      sourceFallback: string;
    };
    notifications: {
      title: string;
      empty: string;
      markAllRead: string;
      alertsEnabled: string;
      alertsDisabled: string;
      unreadLabel: string;
    };
    states: {
      loading: string;
      saving: string;
      signedIn: string;
      signedUp: string;
      signedOut: string;
      accountDeleted: string;
      deletePending: string;
      itemAdded: string;
      itemDeleted: string;
      priceRecorded: string;
      alertsUpdated: string;
      notificationsRead: string;
      unknownError: string;
      validation: {
        emailRequired: string;
        passwordRequired: string;
        passwordTooShort: string;
        accountExists: string;
        invalidCredentials: string;
        authRequired: string;
        nameRequired: string;
        storeRequired: string;
        targetInvalid: string;
        priceInvalid: string;
        itemMissing: string;
        busy: string;
      };
    };
  };
};

export const SITE_COPY: Record<Locale, SiteCopy> = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How It Works",
      faq: "FAQ",
      blog: "Blog",
      getApp: "Get the App",
      downloadIos: "Download on iOS",
      downloadAndroid: "Download on Android",
      language: "Language",
      english: "English",
      french: "French",
    },
    hero: {
      pills: ["Daily Deals", "Watchlist Alerts", "Savings Insight"],
      titleLine1: "Save smarter",
      titleLine2: "Shop better",
      sub:
        "Compare prices across stores, track your watchlist, and " +
        "build better budgets - all in one beautiful app.",
      card: {
        header: "Price Radar",
        rows: [
          { store: "Mart A", price: "$74.20", delta: "-8%" },
          { store: "Mart B", price: "$69.80", delta: "-12%" },
          { store: "Mart C", price: "$72.10", delta: "-9%" },
        ],
        saving: "You could save up to $92/mo",
      },
    },
    features: {
      eyebrow: "FEATURES",
      titleLine1: "Everything you need",
      titleLine2: "to save effortlessly",
      sub:
        "Four powerful modules working together so you spend less " +
        "time hunting and more time saving.",
      cards: [
        {
          title: "Live Price Map",
          body:
            "Instantly compare prices across multiple stores and " +
            "surface the best deal without the legwork.",
        },
        {
          title: "Smart Watchlist",
          body:
            "Pin the products you love and get notified the moment " +
            "prices drop to your target.",
        },
        {
          title: "Budget Planner",
          body:
            "Visualize monthly and yearly savings with a clear " +
            "before-and-after spending forecast.",
        },
        {
          title: "Drop Alerts",
          body:
            "Never miss a deal again. Notifications fire the instant " +
            "a watched item hits your price.",
        },
      ],
    },
    how: {
      eyebrow: "HOW IT WORKS",
      titleLine1: "Three simple steps",
      titleLine2: "to smarter shopping",
      steps: [
        {
          num: "01",
          title: "Search",
          body:
            "Find any product by name or category - our database spans " +
            "all the major stores.",
        },
        {
          num: "02",
          title: "Compare",
          body:
            "See prices side by side, ranked by value. The best deal " +
            "is highlighted instantly.",
        },
        {
          num: "03",
          title: "Save",
          body:
            "Track your wins over time and watch your savings " +
            "compound month after month.",
        },
      ],
      stats: [
        { label: "Avg item delta", value: "$6.40" },
        { label: "Monthly savings", value: "$92" },
        { label: "Yearly savings", value: "$1,104" },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Answers to common questions",
      items: [
        {
          q: "Do I need an account before I can compare prices?",
          a:
            "No. You can search and compare immediately. Sign in is " +
            "optional and only needed for syncing your watchlist and " +
            "budget across devices.",
        },
        {
          q: "How often are prices refreshed?",
          a:
            "Popular items refresh frequently during peak hours, and " +
            "all tracked items are checked on a recurring schedule for " +
            "reliable alerts.",
        },
        {
          q: "Can I use PocketCart on both mobile and web?",
          a:
            "Yes. Your data stays in sync across iOS, Android, and web " +
            "when you use the same account.",
        },
      ],
    },
    cta: {
      eyebrow: "READY?",
      titleLine1: "Start saving today",
      titleLine2: "",
      sub:
        "Download PocketCart and take control of your shopping. " +
        "\n Available on iOS and Android - free to get started.",
    },
    footer: {
      tagline: "Smart shopping habits, simplified.",
      signupTitle: "Get Launch Updates",
      signupSub:
        "Enter your email below to be the first to know when " +
        "PocketCart is available.",
      signupDone: "You are on the list. We will keep you posted.",
      emailPlaceholder: "Enter your email",
      notify: "Notify Me",
      copyright: "© 2026 PocketCart. All rights reserved.",
      groups: [
        {
          title: "Product",
          links: [
            { id: "features", label: "Features" },
            { id: "pricing", label: "Pricing" },
            { id: "faq", label: "FAQ" },
            { id: "roadmap", label: "Roadmap" },
          ],
        },
        {
          title: "Company",
          links: [
            { id: "about", label: "About" },
            { id: "blog", label: "Blog" },
          ],
        },
        {
          title: "Legal",
          links: [
            { id: "privacy", label: "Privacy" },
            { id: "terms", label: "Terms" },
            { id: "delete-account", label: "Delete Account" },
          ],
        },
      ],
    },
    blog: {
      back: "Back to Home",
      backToBlog: "Back to Blog",
      eyebrow: "BLOG",
      title: "PocketCart Journal",
      sub:
        "Tips, product updates, and shopping strategies to help " +
        "you save more each month.",
      readArticle: "Read article",
      featuredLabel: "Featured post",
      latestLabel: "Latest articles",
      relatedPosts: "Related posts",
      minutesRead: "min read",
      posts: [
        {
          title: "How to build a smarter grocery watchlist",
          date: "February 20, 2026",
          body:
            "A practical workflow for tracking staples, setting " +
            "realistic price targets, and catching discounts before " +
            "checkout.",
        },
        {
          title: "The hidden cost of not comparing prices",
          date: "February 12, 2026",
          body:
            "Why small per-item differences add up fast and how to " +
            "use weekly comparison habits to save consistently.",
        },
        {
          title: "Budget-first shopping with PocketCart",
          date: "January 30, 2026",
          body:
            "Learn how to set category caps, prioritize essentials, " +
            "and keep your monthly spending aligned with long-term " +
            "goals.",
        },
      ],
    },
    legal: {
      backToHome: "Back to Home",
      englishOnly: "This legal page is currently available in English only.",
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Service",
      lastUpdated: "Last updated",
    },
    mvp: {
      eyebrow: "MVP",
      title: "PocketCart app scaffold",
      sub:
        "This prototype includes account login, item tracking, " +
        "price history, notifications, and resilient UX states.",
      backToHome: "Back to Home",
      auth: {
        title: "Account",
        sub: "Sign in or create an account to keep your data linked.",
        emailLabel: "Email",
        passwordLabel: "Password",
        signIn: "Sign In",
        signUp: "Create Account",
        signOut: "Sign Out",
        demoHint:
          "Tip: create an account first, then use the same credentials " +
          "to sign in on your next session.",
        welcomePrefix: "Signed in as",
      },
      compliance: {
        title: "Trust & Compliance",
        sub:
          "Use these links and controls to satisfy store review " +
          "requirements for privacy, terms, and account deletion.",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        deletionPortal: "Delete Account Portal",
        deletionPortalHint:
          "Google Play also requires an external deletion URL.",
        openWebDeletion: "Open Web Portal",
        deleteAccount: "Delete My Account",
        deleteAccountConfirm: "Confirm Delete Account",
        cancelDelete: "Cancel",
      },
      deletePage: {
        title: "Account Deletion",
        intro:
          "This page is the external deletion resource required " +
          "for Google Play account-based apps.",
        inAppTitle: "Delete inside the app",
        inAppBody:
          "In-app account controls are not exposed in this build. " +
          "Use the web request method below for deletion.",
        webTitle: "Delete through web request",
        webBody:
          "If you cannot access the app, send a deletion request to " +
          "support@pocketcart.app from your account email address.",
        urlLabel: "Deletion URL",
        retainedTitle: "Data retained after deletion",
        retainedBody:
          "No account-linked cloud profile is retained in this build. " +
          "Deletion requests are processed through support.",
        supportTitle: "Support",
        supportBody:
          "If deletion fails, contact support@pocketcart.app with your " +
          "account email and platform (iOS or Android).",
      },
      items: {
        title: "Tracking Items",
        formTitle: "Add a tracked item",
        nameLabel: "Item name",
        storeLabel: "Store",
        targetLabel: "Target price",
        latestLabel: "Latest price",
        sourceLabel: "Source note",
        addButton: "Add Item",
        empty: "No tracked items yet. Add your first item above.",
        updateButton: "Record Price",
        deleteButton: "Delete",
        latestTag: "Latest",
        targetTag: "Target",
      },
      history: {
        title: "Price History",
        emptyItems: "Add an item first to build history.",
        emptyRows: "No history yet for this item.",
        selectItem: "Select item",
        sourceFallback: "manual update",
      },
      notifications: {
        title: "Notifications",
        empty: "No notifications yet.",
        markAllRead: "Mark all as read",
        alertsEnabled: "Alerts are enabled",
        alertsDisabled: "Alerts are disabled",
        unreadLabel: "Unread",
      },
      states: {
        loading: "Loading your local MVP workspace...",
        saving: "Saving changes...",
        signedIn: "Signed in successfully.",
        signedUp: "Account created and signed in.",
        signedOut: "You are signed out.",
        accountDeleted: "Account and related data were deleted.",
        deletePending:
          "Press confirm to permanently delete this account.",
        itemAdded: "Tracking item added.",
        itemDeleted: "Tracking item removed.",
        priceRecorded: "Price record saved.",
        alertsUpdated: "Alert preference updated.",
        notificationsRead: "Notifications marked as read.",
        unknownError: "Something went wrong. Try again.",
        validation: {
          emailRequired: "Email is required.",
          passwordRequired: "Password is required.",
          passwordTooShort: "Password must be at least 4 characters.",
          accountExists: "This email is already registered.",
          invalidCredentials: "Email or password is incorrect.",
          authRequired: "Please sign in first.",
          nameRequired: "Item name is required.",
          storeRequired: "Store is required.",
          targetInvalid: "Target price must be greater than 0.",
          priceInvalid: "Price must be greater than 0.",
          itemMissing: "Item was not found. Refresh and retry.",
          busy: "Please wait until the current action finishes.",
        },
      },
    },
  },
  fr: {
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
          "Les controles de compte dans l application ne sont pas " +
          "exposes dans cette version. Utilisez la methode web ci-dessous.",
        webTitle: "Supprimer via demande web",
        webBody:
          "Si vous ne pouvez pas ouvrir l application, envoyez " +
          "une demande a support@pocketcart.app avec votre e-mail.",
        urlLabel: "URL de suppression",
        retainedTitle: "Donnees conservees apres suppression",
        retainedBody:
          "Aucun profil cloud lie au compte n est conserve dans " +
          "cette version. Les demandes passent par le support.",
        supportTitle: "Assistance",
        supportBody:
          "Si la suppression echoue, contactez support@pocketcart.app " +
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
  },
};
