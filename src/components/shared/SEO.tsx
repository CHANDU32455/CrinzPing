import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'video.other';
  author?: string;
  publishedTime?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'CrinzPing - Share Your Cringiest Moments';
const DEFAULT_DESCRIPTION = 'CrinzPing is a fun social media platform where you can share cringe messages, memes, posts, and short reels with friends.';
const DEFAULT_IMAGE = 'https://crinzping.com/og-image.png';
const SITE_URL = 'https://crinzping.com';

/**
 * SEO Component - Updates document meta tags dynamically
 * Use this component on each page to set page-specific SEO
 * 
 * @example
 * <SEO 
 *   title="Reels | CrinzPing"
 *   description="Watch the latest short video reels on CrinzPing"
 * />
 */
export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = 'website',
  author,
  publishedTime,
  noIndex = false,
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', description);
    if (keywords) updateMeta('keywords', keywords);
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', image, true);
    updateMeta('og:url', url, true);
    updateMeta('og:type', type, true);
    if (author) updateMeta('article:author', author, true);
    if (publishedTime) updateMeta('article:published_time', publishedTime, true);

    // Twitter tags
    updateMeta('twitter:title', title, true);
    updateMeta('twitter:description', description, true);
    updateMeta('twitter:image', image, true);
    updateMeta('twitter:url', url, true);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Cleanup function to reset to defaults on unmount
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, noIndex]);

  return null; // This component doesn't render anything
};



export default SEO;
