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

export type SiteCopyMap = Record<Locale, SiteCopy>;
