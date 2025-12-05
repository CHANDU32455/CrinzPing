import SEO from "./SEO";
const DEFAULT_IMAGE = 'https://crinzping.com/og-image.png';



/**
 * SEO Components for common pages
 */
export const HomeSEO = () => (
    <SEO
        title="CrinzPing - Share Your Cringiest Moments | Social Media Platform"
        description="CrinzPing is a fun social media platform where you can share cringe messages, memes, posts, and short reels with friends. Join the cringeverse today!"
        keywords="CrinzPing, cringe, social media, memes, reels, posts, entertainment"
    />
);

export const FeedSEO = () => (
    <SEO
        title="Feed | CrinzPing - Latest Posts & Memes"
        description="Explore the latest cringe posts, memes, and content from the CrinzPing community. Like, comment, and share your favorites."
        keywords="feed, posts, memes, cringe content, CrinzPing"
        url="https://crinzping.com/feed"
    />
);

export const ReelsSEO = () => (
    <SEO
        title="Reels | CrinzPing - Short Video Clips"
        description="Watch and create short video reels on CrinzPing. Share your cringiest moments in 30-second clips."
        keywords="reels, short videos, clips, video sharing, CrinzPing"
        url="https://crinzping.com/reels"
        type="video.other"
    />
);

export const ExploreSEO = () => (
    <SEO
        title="Explore | CrinzPing - Discover Content"
        description="Explore trending cringe content, discover new creators, and find the best posts and reels on CrinzPing."
        keywords="explore, discover, trending, popular, CrinzPing"
        url="https://crinzping.com/explore"
    />
);

export const AboutSEO = () => (
    <SEO
        title="About Us | CrinzPing - The Cringiest Social Platform"
        description="Learn about CrinzPing, the social platform for savage vibes, unfiltered content, and unapologetic laughs."
        url="https://crinzping.com/about"
    />
);

/**
 * Profile SEO - Pass user's profile pic for sharing!
 * @example <ProfileSEO username="John" tagline="Cringe King" profilePic="https://..." userId="123" />
 */
export const ProfileSEO = ({
    username,
    tagline,
    profilePic,
    userId
}: {
    username?: string;
    tagline?: string;
    profilePic?: string;
    userId?: string;
}) => (
    <SEO
        title={username ? `${username} | CrinzPing` : 'Profile | CrinzPing'}
        description={tagline || `Check out ${username || 'this user'}'s profile on CrinzPing. See their posts, reels, and crinz messages.`}
        image={profilePic || DEFAULT_IMAGE} // Uses user's profile pic for social sharing!
        type="profile"
        url={userId ? `https://crinzping.com/profile/${userId}` : 'https://crinzping.com/profile'}
    />
);

export const PrivacySEO = () => (
    <SEO
        title="Privacy Policy | CrinzPing"
        description="Read CrinzPing's Privacy Policy to understand how we collect, use, and protect your personal information."
        url="https://crinzping.com/privacy"
    />
);

export const TermsSEO = () => (
    <SEO
        title="Terms of Service | CrinzPing"
        description="Read CrinzPing's Terms of Service to understand the rules and guidelines for using our platform."
        url="https://crinzping.com/terms"
    />
);

export const ContributeCrinzSEO = () => (
    <SEO
        title="Contribute Crinz | CrinzPing"
        description="Share your cringiest quotes and messages on CrinzPing. Create and contribute to the cringeverse!"
        keywords="contribute, create, crinz, quote, message, CrinzPing"
        url="https://crinzping.com/contributeCrinz"
    />
);

export const CreatePostSEO = () => (
    <SEO
        title="Create Post | CrinzPing"
        description="Create and share a new post with images and audio on CrinzPing."
        noIndex={true}
    />
);

export const CreateReelSEO = () => (
    <SEO
        title="Create Reel | CrinzPing"
        description="Create and share a new short video reel on CrinzPing."
        noIndex={true}
    />
);


