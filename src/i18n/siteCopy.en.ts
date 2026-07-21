import type { SiteCopy } from "./siteCopyTypes";

export const enSiteCopy: SiteCopy = {
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
            { id: "support", label: "Support" },
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
          "Open the More tab in the iOS or Android app, then choose " +
          "Account deletion to request deletion from your account settings.",
        webTitle: "Delete through web request",
        webBody:
          "If you cannot access the app, use the PocketCart support page " +
          "and include your account email address in the request details.",
        urlLabel: "Deletion URL",
        retainedTitle: "Data retained after deletion",
        retainedBody:
          "Account-linked profile, watchlist, and preference data are deleted " +
          "unless retention is required for security, fraud prevention, or law.",
        supportTitle: "Support",
        supportBody:
          "If deletion fails, open https://pocketcart.pages.dev/support " +
          "and include your account email and platform (iOS or Android).",
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
};
