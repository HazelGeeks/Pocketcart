import type { Locale } from "../i18n/types";

type BlogSection = {
  heading: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  readMinutes: number;
  sections: BlogSection[];
};

const BLOG_POSTS: Record<Locale, BlogPost[]> = {
  en: [
    {
      slug: "smarter-grocery-watchlist",
      title: "How to build a smarter grocery watchlist",
      description:
        "A practical system for tracking staples, setting realistic target prices, and spotting discounts before checkout day.",
      excerpt:
        "Track the products you buy every week, define a target you would actually act on, and review your list on a fixed schedule.",
      publishedAt: "2026-03-01",
      readMinutes: 5,
      sections: [
        {
          heading: "Start with repeat purchases",
          paragraphs: [
            "A good grocery watchlist is not a random list of nice-to-have products. It starts with the handful of items that show up in your basket almost every week: milk, eggs, yogurt, rice, coffee, bread, and household basics.",
            "Those are the products where a small price gap keeps repeating. Even a one-dollar difference becomes meaningful when the same item appears four or five times each month.",
          ],
        },
        {
          heading: "Set a target price you would actually trust",
          paragraphs: [
            "Many shoppers choose target prices that are too optimistic, which makes the watchlist feel useless. A better method is to review the last few prices you paid and set a threshold that is clearly better than normal but still realistic.",
            "That turns the watchlist into a decision tool instead of a wish list. When the price drops below your threshold, you know the signal is worth attention.",
          ],
        },
        {
          heading: "Review on a fixed rhythm",
          paragraphs: [
            "The watchlist works best when it becomes part of a routine. A short review before your weekly shop is usually enough. You do not need constant checking if the list is focused and your alerts are limited to items that matter.",
            "Over time, you stop reacting to every sale banner and start buying when the math is in your favor.",
          ],
        },
      ],
    },
    {
      slug: "hidden-cost-of-not-comparing-prices",
      title: "The hidden cost of not comparing prices",
      description:
        "Why small per-item price gaps add up quickly, and how a simple comparison habit protects your monthly budget.",
      excerpt:
        "Skipping comparison feels fast, but repeated over dozens of items it quietly becomes one of the biggest leaks in a household budget.",
      publishedAt: "2026-02-24",
      readMinutes: 4,
      sections: [
        {
          heading: "The leak is rarely dramatic",
          paragraphs: [
            "Most overspending does not come from one catastrophic purchase. It comes from small differences spread across many ordinary decisions. One brand is two dollars higher, another pantry item is ninety cents higher, and a cleaning product is on the wrong shelf at the wrong time.",
            "Individually those choices feel harmless. In aggregate they become a pattern that eats into savings without creating any visible benefit.",
          ],
        },
        {
          heading: "Comparison reduces guesswork",
          paragraphs: [
            "When you compare prices side by side, you remove the emotional part of the decision. Instead of buying based on convenience or packaging, you buy with one clear question in mind: which option delivers the best value right now?",
            "That habit also improves category awareness. You begin to notice what a good price looks like, which stores run stronger promotions, and when waiting is more efficient than buying immediately.",
          ],
        },
        {
          heading: "Consistency matters more than intensity",
          paragraphs: [
            "You do not need to compare every product in every store forever. The better approach is to compare the categories you buy most often and repeat that process every week. The savings will compound because your decisions become repeatable.",
          ],
        },
      ],
    },
    {
      slug: "budget-first-shopping-plan",
      title: "Budget-first shopping with PocketCart",
      description:
        "How to set category caps, prioritize essentials, and make price comparisons support a real monthly budget.",
      excerpt:
        "A shopping plan works better when each category has a role: essentials first, flexible spending second, and opportunistic deals last.",
      publishedAt: "2026-02-18",
      readMinutes: 5,
      sections: [
        {
          heading: "Separate needs from flexible purchases",
          paragraphs: [
            "A budget-first shopping plan starts before you compare prices. First define the categories that must be funded every month: groceries, core household supplies, and health basics. Then create a smaller flexible bucket for convenience items or experiments.",
            "That separation helps you avoid a common trap: feeling productive because you found a discount, even though the item was not important in the first place.",
          ],
        },
        {
          heading: "Use limits as buying guides",
          paragraphs: [
            "A category cap is not there to punish you. It gives every comparison context. If pantry spending is already close to the monthly limit, then even a decent promotion may not be the right move.",
            "When you connect price checking to a category cap, you stop treating every sale as an automatic win.",
          ],
        },
        {
          heading: "Track what the plan teaches you",
          paragraphs: [
            "After a few cycles, the budget becomes a feedback loop. You can see which categories are easy to optimize, which products create drift, and where a better watchlist or alert would save you more time.",
            "That is the point where a shopping app becomes useful: it turns price awareness into a system instead of another spreadsheet chore.",
          ],
        },
      ],
    },
    {
      slug: "use-unit-pricing-to-find-real-deals",
      title: "Use unit pricing to find real deals",
      description:
        "Pack sizes can hide weak offers. Unit pricing makes bulk, multi-pack, and family-size comparisons easier to trust.",
      excerpt:
        "A bigger pack is not always the better deal. Unit pricing gives you the cleanest way to compare size changes, bundle offers, and private-label alternatives.",
      publishedAt: "2026-02-10",
      readMinutes: 4,
      sections: [
        {
          heading: "Shelf prices can be misleading",
          paragraphs: [
            "Retailers know that bigger numbers influence fast decisions. A large package may look cheaper than two smaller ones, and a multi-buy label can suggest urgency even when the value is weak.",
            "Unit pricing cuts through that framing. Price per gram, ounce, liter, or sheet reveals whether the larger option is actually efficient.",
          ],
        },
        {
          heading: "Compare across brands and sizes",
          paragraphs: [
            "Unit pricing becomes especially useful when the pack sizes are inconsistent. One yogurt tub might be 750 grams, another 650 grams, and the sale label only shows total price.",
            "When the comparison is normalized, premium packaging and promotional language lose their influence. You can compare on value instead of presentation.",
          ],
        },
        {
          heading: "Use it to avoid overbuying",
          paragraphs: [
            "The cheapest unit price is still not a good deal if it creates waste. The best option is the one that combines value with a quantity your household can actually use. Unit pricing is most effective when paired with realistic consumption habits.",
          ],
        },
      ],
    },
    {
      slug: "build-a-seasonal-savings-calendar",
      title: "Build a seasonal savings calendar for staples",
      description:
        "A seasonal savings calendar helps you predict when categories are likely to be discounted and when to buy ahead.",
      excerpt:
        "Staples, pantry goods, cleaning products, and household basics often move in seasonal cycles. A simple calendar makes those patterns useful.",
      publishedAt: "2026-02-02",
      readMinutes: 5,
      sections: [
        {
          heading: "Seasonality is more common than it looks",
          paragraphs: [
            "Not every product is seasonal, but many categories follow predictable rhythms. Back-to-school periods affect snack packs and lunch supplies. Holiday windows change baking goods, coffee, pantry ingredients, and cleaning products.",
            "If you only shop week to week, those patterns remain invisible. A calendar turns scattered promotions into something you can plan around.",
          ],
        },
        {
          heading: "Track categories, not every single SKU",
          paragraphs: [
            "You do not need a giant spreadsheet of product-level history to benefit from seasonality. Start at the category level: cereal, detergent, paper goods, canned goods, and freezer basics.",
            "Once you know when a category tends to soften, you can buy ahead when the timing and storage space make sense.",
          ],
        },
        {
          heading: "Planning reduces urgency buys",
          paragraphs: [
            "A savings calendar works because it changes your timing. When you know another strong discount window is likely a few weeks away, you are less tempted to pay a weak price out of habit.",
            "That patience can save more than chasing every minor deal in real time.",
          ],
        },
      ],
    },
    {
      slug: "set-price-alerts-without-overbuying",
      title: "Set price alerts without overbuying",
      description:
        "The best price alert is specific enough to help you act, but narrow enough that you do not buy products just because they are discounted.",
      excerpt:
        "Alerts should support your plan, not replace it. The right threshold, cadence, and product mix make them useful instead of noisy.",
      publishedAt: "2026-01-26",
      readMinutes: 4,
      sections: [
        {
          heading: "Too many alerts create weak decisions",
          paragraphs: [
            "A long alert list usually leads to one of two bad outcomes: you ignore everything, or you buy items simply because they crossed a threshold. Neither helps your budget.",
            "A smaller alert set built around repeat purchases and true price targets is much easier to trust.",
          ],
        },
        {
          heading: "Define the action before the alert",
          paragraphs: [
            "Before creating an alert, decide what you would do if it fires. Would you buy one unit, buy ahead for the month, or only compare against another store? If there is no action attached, the alert probably does not need to exist.",
            "This keeps your list practical and keeps your attention focused on decisions that move the budget.",
          ],
        },
        {
          heading: "Pair alerts with storage reality",
          paragraphs: [
            "Price alerts are powerful for durable staples, but weaker for products that spoil quickly or require too much storage. The goal is not maximum alert volume. The goal is a set of reminders that consistently lead to good buying decisions.",
          ],
        },
      ],
    },
  ],
  fr: [
    {
      slug: "smarter-grocery-watchlist",
      title: "Creer une liste de suivi courses plus intelligente",
      description:
        "Une methode pratique pour suivre les essentiels, fixer un vrai prix cible et reperer les bonnes remises avant les courses.",
      excerpt:
        "Suivez les produits que vous achetez chaque semaine, fixez un seuil utile et revoyez la liste selon un rythme simple.",
      publishedAt: "2026-03-01",
      readMinutes: 5,
      sections: [
        {
          heading: "Commencer par les achats repetes",
          paragraphs: [
            "Une bonne liste de suivi ne commence pas par des produits occasionnels. Elle commence par les quelques articles qui reviennent presque chaque semaine: lait, oeufs, riz, cafe, pain et produits maison.",
            "C est sur ces achats repetes que de petits ecarts de prix deviennent importants. Un seul dollar de difference prend du poids quand le meme produit revient plusieurs fois par mois.",
          ],
        },
        {
          heading: "Choisir un prix cible credible",
          paragraphs: [
            "Beaucoup de personnes fixent des prix cibles trop optimistes. La liste semble alors inutile parce qu aucune alerte n est vraiment exploitable. Il vaut mieux observer les derniers prix payes et viser un seuil clairement meilleur mais realiste.",
            "La liste devient alors un outil de decision. Quand le prix passe sous ce niveau, vous savez que le signal vaut votre attention.",
          ],
        },
        {
          heading: "Revoir la liste selon un rythme fixe",
          paragraphs: [
            "Le suivi fonctionne mieux quand il s integre a une routine. Un point rapide avant les courses hebdomadaires suffit souvent. Vous n avez pas besoin de verifier sans cesse si la liste est concentree sur les vrais produits importants.",
            "Avec le temps, vous reagissez moins aux affiches promotionnelles et davantage aux chiffres qui vous avantagent vraiment.",
          ],
        },
      ],
    },
    {
      slug: "hidden-cost-of-not-comparing-prices",
      title: "Le cout cache de l absence de comparaison",
      description:
        "Pourquoi de petits ecarts de prix finissent par peser lourd, et comment une habitude simple protege le budget mensuel.",
      excerpt:
        "Ne pas comparer semble rapide, mais repete sur des dizaines d achats cela devient une fuite silencieuse dans le budget.",
      publishedAt: "2026-02-24",
      readMinutes: 4,
      sections: [
        {
          heading: "La perte est rarement spectaculaire",
          paragraphs: [
            "La plupart des depassements ne viennent pas d un seul gros achat. Ils viennent de petites differences repetes sur des decisions ordinaires. Une marque coute un peu plus, un produit garde-manger est plus cher ailleurs, un article menager est pris sans verifier.",
            "Pris separement, ces choix paraissent mineurs. Ensemble, ils deviennent une habitude couteuse sans veritable avantage pour le foyer.",
          ],
        },
        {
          heading: "Comparer reduit l approximation",
          paragraphs: [
            "Quand vous comparez les prix cote a cote, vous retirez une partie de l emotion de l achat. Au lieu de choisir par reflexe ou par emballage, vous revenez a une question simple: quelle option donne la meilleure valeur maintenant?",
            "Cette habitude vous apprend aussi quels magasins sont regulierement competitifs et quels prix meritent d etre memorises.",
          ],
        },
        {
          heading: "La constance compte plus que l intensite",
          paragraphs: [
            "Il n est pas necessaire de comparer chaque produit partout. Il vaut mieux comparer regulierement les categories les plus frequentes. Les economies viennent surtout de la repetition de bonnes decisions.",
          ],
        },
      ],
    },
    {
      slug: "budget-first-shopping-plan",
      title: "Acheter avec une strategie budget d abord",
      description:
        "Comment fixer des plafonds par categorie, prioriser l essentiel et connecter la comparaison de prix a un vrai budget mensuel.",
      excerpt:
        "Un plan d achat fonctionne mieux quand chaque categorie a un role clair: essentiel d abord, flexible ensuite, opportunites seulement en dernier.",
      publishedAt: "2026-02-18",
      readMinutes: 5,
      sections: [
        {
          heading: "Distinguer besoin et depense flexible",
          paragraphs: [
            "Un plan d achat efficace commence avant la comparaison. Il faut d abord definir les categories qui doivent etre financees chaque mois: courses essentielles, produits maison et besoins de base.",
            "Cette separation evite une erreur courante: se sentir efficace parce qu un article est en promotion alors qu il n etait pas prioritaire.",
          ],
        },
        {
          heading: "Utiliser les plafonds comme repere",
          paragraphs: [
            "Un plafond de categorie n est pas la pour vous bloquer. Il donne un contexte a chaque achat. Si le budget garde-manger est deja presque atteint, meme une promotion correcte n est pas forcement une bonne decision.",
            "Quand la comparaison de prix est liee a une enveloppe, chaque remise est evaluee en fonction du plan et non seulement du message promotionnel.",
          ],
        },
        {
          heading: "Suivre ce que le plan vous apprend",
          paragraphs: [
            "Au bout de quelques cycles, le budget devient un outil d analyse. Vous voyez quelles categories sont faciles a optimiser, quels produits vous font devier et ou un meilleur suivi ferait gagner du temps.",
            "C est la que l application devient utile: elle transforme une bonne intention en systeme repetable.",
          ],
        },
      ],
    },
    {
      slug: "use-unit-pricing-to-find-real-deals",
      title: "Utiliser le prix a l unite pour voir les vraies offres",
      description:
        "Les formats et lots peuvent tromper. Le prix a l unite rend les comparaisons entre tailles et marques beaucoup plus fiables.",
      excerpt:
        "Un grand format n est pas toujours une bonne affaire. Le prix a l unite permet de comparer tailles, lots et marques avec une base commune.",
      publishedAt: "2026-02-10",
      readMinutes: 4,
      sections: [
        {
          heading: "Le prix en rayon peut tromper",
          paragraphs: [
            "Les grands chiffres influencent vite la perception. Un gros paquet peut sembler avantageux et une etiquette de lot peut suggerer une urgence qui n existe pas vraiment.",
            "Le prix a l unite retire cet effet. Prix par gramme, litre ou feuille: la comparaison redevient nette.",
          ],
        },
        {
          heading: "Comparer entre marques et formats",
          paragraphs: [
            "Le prix a l unite devient encore plus utile quand les tailles varient. Un pot peut faire 750 grammes, un autre 650, tandis que le prix affiche seul ne raconte pas toute l histoire.",
            "Une fois la comparaison normalisee, vous jugez la valeur plutot que l emballage.",
          ],
        },
        {
          heading: "Eviter aussi le sur-achat",
          paragraphs: [
            "Le meilleur prix a l unite n est pas une victoire s il cree du gaspillage. La bonne option est celle qui combine valeur et quantite adaptee a votre consommation reelle.",
          ],
        },
      ],
    },
    {
      slug: "build-a-seasonal-savings-calendar",
      title: "Construire un calendrier saisonnier des economies",
      description:
        "Un calendrier saisonnier aide a prevoir quand certaines categories baissent et quand il vaut la peine d acheter en avance.",
      excerpt:
        "De nombreux essentiels suivent des cycles assez previsibles. Un simple calendrier rend ces motifs plus utiles.",
      publishedAt: "2026-02-02",
      readMinutes: 5,
      sections: [
        {
          heading: "La saisonnalite est plus presente qu on ne croit",
          paragraphs: [
            "Tout n est pas saisonnier, mais beaucoup de categories suivent un rythme. La rentree influence certains snacks et fournitures. Les periodes de fete touchent cafe, produits de cuisson, surgele et articles menagers.",
            "Si vous achetez seulement semaine par semaine, ces tendances restent invisibles. Un calendrier les rend exploitables.",
          ],
        },
        {
          heading: "Suivre les categories avant les SKU",
          paragraphs: [
            "Vous n avez pas besoin d un historique complet produit par produit pour profiter de la saisonnalite. Commencez par les grandes familles: cereales, detergent, papier, conserves, congelateur.",
            "Quand vous savez qu une categorie devient plus favorable a certains moments, vous pouvez acheter en avance de facon rationnelle.",
          ],
        },
        {
          heading: "Mieux planifier, moins acheter dans l urgence",
          paragraphs: [
            "Le calendrier fonctionne parce qu il change votre timing. Si vous savez qu une fenetre plus forte approche, vous etes moins tente de payer un prix mediocre par automatisme.",
            "Cette patience rapporte souvent davantage que la chasse a chaque petite promotion.",
          ],
        },
      ],
    },
    {
      slug: "set-price-alerts-without-overbuying",
      title: "Regler des alertes prix sans suracheter",
      description:
        "Une bonne alerte doit aider a agir au bon moment, pas pousser a acheter juste parce qu un prix a baisse.",
      excerpt:
        "Les alertes doivent soutenir votre plan. Le bon seuil, le bon rythme et les bons produits font toute la difference.",
      publishedAt: "2026-01-26",
      readMinutes: 4,
      sections: [
        {
          heading: "Trop d alertes affaiblissent la decision",
          paragraphs: [
            "Une longue liste d alertes conduit souvent a deux mauvais resultats: vous ignorez tout, ou vous achetez des articles uniquement parce qu ils ont franchi un seuil.",
            "Un ensemble plus petit, centre sur les achats repetes et les vrais prix cibles, est bien plus utile.",
          ],
        },
        {
          heading: "Definir l action avant l alerte",
          paragraphs: [
            "Avant de creer une alerte, decidez ce que vous ferez si elle se declenche. Acheter une unite? Faire une comparaison supplementaire? Acheter pour plusieurs semaines? Sans action claire, l alerte est probablement inutile.",
            "Cette discipline garde votre attention pour les decisions qui changent vraiment le budget.",
          ],
        },
        {
          heading: "Tenir compte du stockage et de l usage",
          paragraphs: [
            "Les alertes sont puissantes pour les produits durables, mais moins pertinentes pour les articles qui se periment vite ou prennent trop de place. Le bon systeme n est pas celui qui envoie le plus de signaux, c est celui qui aide a acheter mieux.",
          ],
        },
      ],
    },
  ],
};

export function getBlogPosts(locale: Locale): BlogPost[] {
  return BLOG_POSTS[locale];
}

export function getBlogPost(
  locale: Locale,
  slug: string | null,
): BlogPost | null {
  if (!slug) return null;
  return BLOG_POSTS[locale].find((post) => post.slug === slug) ?? null;
}
