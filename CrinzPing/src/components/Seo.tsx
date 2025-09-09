// src/components/Seo.tsx
import { Title, Meta } from "react-head";
import type { ReactNode } from "react";

// global constants
export const BASE_URL = import.meta.env.VITE_COGNITO_LOGOUT_URI; // thats the base url..
export const OG_IMAGE = `${BASE_URL}/CrinzPing.png`;

type SeoBlock = () => ReactNode;

// --- STATIC SEO COMPONENTS ---
export const HomeSeo: SeoBlock = () => (
  <>
    <Title>Crinzping - Fun Daily Roasts</Title>
    <Meta
      name="description"
      content="Crinzping is a fun entertainment app that delivers hilarious roast-style messages every day. Share jokes, laugh with friends, and enjoy witty fun."
    />
    <Meta
      name="keywords"
      content="roast, funny app, daily jokes, crinzping, entertainment, witty messages, share roasts"
    />
    <Meta property="og:title" content="Crinzping - Fun Daily Roasts" />
    <Meta property="og:description" content="Crinzping delivers hilarious roast-style messages daily. Fun, quirky, and shareable!" />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content={BASE_URL + "/"} />
    <Meta property="og:image" content={OG_IMAGE} />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content="Crinzping - Fun Daily Roasts" />
    <Meta name="twitter:description" content="Crinzping delivers hilarious roast-style messages daily. Fun, quirky, and shareable!" />
    <Meta name="twitter:image" content={OG_IMAGE} />
  </>
);

export const AboutSeo: SeoBlock = () => (
  <>
    <Title>About Crinzping</Title>
    <Meta
      name="description"
      content="Discover Crinzping, the funny entertainment app built to brighten your day with roast messages, witty content, and shareable jokes."
    />
    <Meta property="og:title" content="About Crinzping" />
    <Meta property="og:description" content="Discover Crinzping, the funny app with roast messages and shareable jokes." />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content={BASE_URL + "/about"} />
    <Meta property="og:image" content={OG_IMAGE} />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content="About Crinzping" />
    <Meta name="twitter:description" content="Discover Crinzping, the funny app with roast messages and shareable jokes." />
    <Meta name="twitter:image" content={OG_IMAGE} />
  </>
);

export const FeedSeo: SeoBlock = () => (
  <>
    <Title>Your Crinz Feed</Title>
    <Meta
      name="description"
      content="Browse your personalized Crinzping feed full of funny roast-style messages, entertaining content, and laugh-worthy posts every day."
    />
    <Meta property="og:title" content="Your Crinz Feed" />
    <Meta property="og:description" content="Browse your personalized Crinzping feed full of hilarious roasts and entertaining content." />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content={BASE_URL + "/feed"} />
    <Meta property="og:image" content={OG_IMAGE} />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content="Your Crinz Feed" />
    <Meta name="twitter:description" content="Browse your personalized Crinzping feed full of hilarious roasts and entertaining content." />
    <Meta name="twitter:image" content={OG_IMAGE} />
  </>
);

export const ExtrasSeo: SeoBlock = () => (
  <>
    <Title>Extras - Crinzping</Title>
    <Meta
      name="description"
      content="Explore extra roast content, bonus jokes, and hidden fun inside Crinzping. More laughs, more entertainment, just for you."
    />
    <Meta property="og:title" content="Extras - Crinzping" />
    <Meta property="og:description" content="Explore extra roast content, bonus jokes, and hidden fun inside Crinzping." />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content={BASE_URL + "/extras"} />
    <Meta property="og:image" content={OG_IMAGE} />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content="Extras - Crinzping" />
    <Meta name="twitter:description" content="Explore extra roast content, bonus jokes, and hidden fun inside Crinzping." />
    <Meta name="twitter:image" content={OG_IMAGE} />
  </>
);

export const ContributeSeo: SeoBlock = () => (
  <>
    <Title>Contribute a Crinz</Title>
    <Meta
      name="description"
      content="Contribute your own roast messages and become part of the Crinzping community. Share your wit and entertain users worldwide."
    />
    <Meta property="og:title" content="Contribute a Crinz" />
    <Meta property="og:description" content="Share your roast messages and become part of the Crinzping community." />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content={BASE_URL + "/contribute"} />
    <Meta property="og:image" content={OG_IMAGE} />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content="Contribute a Crinz" />
    <Meta name="twitter:description" content="Share your roast messages and become part of the Crinzping community." />
    <Meta name="twitter:image" content={OG_IMAGE} />
  </>
);

// --- DYNAMIC SEO COMPONENT ---
interface DynamicSeoProps {
  title: string;
  description: string;
  slug?: string; // optional path, default to "/"
}

export const DynamicSeo: React.FC<DynamicSeoProps> = ({ title, description, slug = "/" }) => (
  <>
    <Title>{title}</Title>
    <Meta name="description" content={description} />
    <Meta property="og:title" content={title} />
    <Meta property="og:description" content={description} />
    <Meta property="og:type" content="website" />
    <Meta property="og:url" content={BASE_URL + slug} />
    <Meta property="og:image" content={OG_IMAGE} />
    <Meta name="twitter:card" content="summary_large_image" />
    <Meta name="twitter:title" content={title} />
    <Meta name="twitter:description" content={description} />
    <Meta name="twitter:image" content={OG_IMAGE} />
  </>
);

export default DynamicSeo;
