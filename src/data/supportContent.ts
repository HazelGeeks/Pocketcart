import type { Locale } from "../i18n/types";
export const SUPPORT_EMAIL = "hello@pocketcart.app";

const PRIVACY_URL = "https://pocketcart.app/privacy";
const TERMS_URL = "https://pocketcart.app/terms";
export const DELETION_URL = "https://pocketcart.app/delete-account";

const SUPPORT_SECTIONS = [
  {
    title: "App Help",
    body: "Find account access, privacy, and account deletion guidance below. Camera and location permissions are optional; receipts support manual entry and the map supports city or postal-code search.",
  },
  {
    title: "Account Access",
    body: "Sign in with the same email address or sign-in method you used to create your account. If you signed up by email, check your inbox and spam folder for the verification email before trying again.",
  },
  {
    title: "Account Deletion",
    body: "You can delete your account in the app from Account > Account actions > Delete Account. If you cannot access the app, use the deletion page below for account deletion instructions.",
    url: DELETION_URL,
  },
  {
    title: "Privacy & Terms",
    body: "Review PocketCart's privacy and terms pages before using the app or submitting a store review question.",
    url: PRIVACY_URL,
    secondaryUrl: TERMS_URL,
  },
];


export function supportSections(locale: Locale) {
  return locale === "fr"
    ? [
        {
          title: "Aide avec l’application",
          body: "Retrouvez ci-dessous des conseils sur l’accès à votre compte, la confidentialité et la suppression. Les autorisations de caméra et de localisation sont facultatives : les reçus peuvent être saisis manuellement et la carte accepte une ville ou un code postal.",
        },
        {
          title: "Accès au compte",
          body: "Connectez-vous avec l’adresse e-mail ou la méthode utilisée lors de l’inscription. Pour une inscription par e-mail, vérifiez votre boîte de réception et vos courriers indésirables pour trouver l’e-mail de confirmation.",
        },
        {
          title: "Suppression du compte",
          body: "Dans l’application, ouvrez Account > Account actions > Delete Account. Si vous ne pouvez pas accéder à l’application, utilisez la page de suppression ci-dessous.",
          url: DELETION_URL,
        },
        {
          title: "Confidentialité et conditions",
          body: "Consultez nos pages de confidentialité et nos conditions pour en savoir plus sur l’utilisation de PocketCart.",
          url: PRIVACY_URL,
          secondaryUrl: TERMS_URL,
        },
      ]
    : SUPPORT_SECTIONS;

}

export const SUPPORT_CONTACT: Record<Locale, string> = {
  en: "Email us for account help or requests about your personal data. For privacy requests, include “Privacy request” in the subject. Never send your password or sign-in codes.",
  fr: "Écrivez-nous pour obtenir de l’aide ou exercer vos droits sur vos données. Pour une demande relative à la confidentialité, indiquez « Privacy request » dans l’objet. Ne communiquez jamais votre mot de passe ni vos codes de connexion.",
};
