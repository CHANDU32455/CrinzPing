/**
 * Roast Messages Utility
 * Because users need to be humbled at every opportunity 🔥
 */

// Get a random item from an array
const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ============================================
// LOADING STATES
// ============================================
export const loadingRoasts = {
    general: [
        "Hold up, not everyone has fiber internet like you pretend to...",
        "Loading... unlike your social life",
        "Patience. Something you clearly lack.",
        "Still faster than your upload speed",
        "Loading your cringe content...",
        "Fetching data... this might take a while with your WiFi",
        "Almost there... just like your gym goals",
    ],

    profile: [
        "Loading your 'interesting' profile...",
        "Fetching your stats... hope you're ready for disappointment",
        "Loading... preparing the cringe",
    ],

    feed: [
        "Loading posts from people who actually have friends...",
        "Fetching content... hopefully not as boring as yours",
        "Loading the feed... try not to be jealous",
    ],

    reels: [
        "Loading reels... hope your attention span survives",
        "Buffering videos... blame your internet, not us",
        "Loading content creators who actually try...",
    ],

    auth: [
        "Checking if you're real... doubtful",
        "Verifying your existence...",
        "Authenticating your cringe credentials...",
    ],
};

// ============================================
// EMPTY STATES
// ============================================
export const emptyRoasts = {
    feed: [
        "Wow, such empty. Even your feed is ghosting you 💀",
        "No posts? Your timeline is as dead as your social life",
        "Nothing here... just like your dating prospects",
        "Empty feed. Maybe try being more interesting?",
    ],

    followers: [
        "0 followers. Even your mom didn't follow you? 😢",
        "No followers yet. Shocking. (Not really)",
        "Follower count: 0. Just like your influence.",
        "Nobody's following you. Can't blame them honestly.",
    ],

    following: [
        "Following 0 people? Trust issues much?",
        "Not following anyone? Peak introvert behavior.",
        "You follow no one. Very mysterious... or just lonely.",
    ],

    posts: [
        "No posts? What have you been doing with your life?",
        "0 posts. The silence is deafening.",
        "Your posts section is emptier than your wallet after payday.",
    ],

    reels: [
        "No reels? Camera shy or just boring?",
        "Zero reels. Not everyone can be a content creator... clearly.",
        "No reels to show. Creativity.exe not found.",
    ],

    messages: [
        "No crinz yet. So empty... just like your DMs 💔",
        "Zero messages. Even the bots left you on read.",
        "No crinz? Your cringe game is weak.",
    ],

    comments: [
        "No comments. So boring nobody wants to talk to you 🦗",
        "0 comments. The crickets are loud here.",
        "Zero comments. Even haters won't engage.",
    ],

    likes: [
        "No likes. Not even a pity like from yourself? 😂",
        "0 likes. Tragic, really.",
        "Zero likes. It's okay, self-love is overrated anyway.",
    ],

    search: [
        "No results. Maybe try searching for something that exists?",
        "Nothing found. Your search skills need work.",
        "0 results. Have you tried typing correctly?",
    ],
};

// ============================================
// ERROR STATES
// ============================================
export const errorRoasts = {
    general: [
        "Something went wrong. Shocker.",
        "Error occurred. Technology hates you specifically.",
        "Oops! Even our servers are cringing at you.",
        "Failed. Just like your New Year's resolutions.",
    ],

    upload: [
        "Upload failed. Your trash content couldn't even upload properly 🗑️",
        "Upload error. Maybe the server has taste after all.",
        "Failed to upload. The universe is protecting us.",
    ],

    network: [
        "Network error. Is your WiFi from 2005?",
        "Connection failed. Did you pay your internet bill?",
        "No internet. Perfect excuse for your lack of posts.",
    ],

    notFound: [
        "404: This page is as lost as you are in life",
        "Not found. Another dead end for you.",
        "Doesn't exist. Like your chances of going viral.",
    ],

    auth: [
        "Authentication failed. Even we don't want you here.",
        "Login error. Did you forget your password... again?",
        "Access denied. The VIP section isn't for everyone.",
    ],

    validation: [
        "Invalid input. Did you even graduate kindergarten?",
        "Wrong format. Try using your brain next time.",
        "Error: Common sense not detected.",
    ],
};

// ============================================
// SUCCESS/CELEBRATION (Still sarcastic)
// ============================================
export const successRoasts = {
    post: [
        "Posted! Now the world gets to see your cringe 🎉",
        "Uploaded successfully. Congrats, I guess?",
        "Posted! Let's see how many ignore it.",
    ],

    like: [
        "You liked it. Your taste is... interesting.",
        "Liked! At least someone appreciates mediocrity.",
    ],

    follow: [
        "Following! Bold move. Let's see if you regret it.",
        "Followed! Their content better be worth it.",
    ],

    unfollow: [
        "Unfollowed. One less bad influence.",
        "Unfollowed! Their content wasn't giving anyway.",
    ],

    delete: [
        "Deleted! Finally showing some self-awareness.",
        "Gone! One less cringe post in the world.",
    ],

    save: [
        "Saved! Changes applied (not that anyone cares).",
        "Updated! Let's hope this version is better.",
    ],
};

// ============================================
// PROFILE SPECIFIC
// ============================================
export const profileRoasts = {
    noTagline: [
        "No tagline set... typical cringer behavior 🙄",
        "No bio? Too cool or too lazy?",
        "Tagline: [Insert personality here]",
    ],

    noPic: [
        "No profile pic? What are you hiding? 👀",
        "Default avatar? Peak mysterious energy.",
        "No photo? Trust issues or just ugly? (kidding... maybe)",
    ],

    viewingOwn: [
        "Staring at your own profile again? Narcissist much?",
        "Back to check if you're still unpopular?",
    ],
};

// ============================================
// ACTIONS/BUTTONS
// ============================================
export const actionRoasts = {
    createFirst: [
        "Create your first cringe ✨",
        "Start embarrassing yourself today",
        "Be the cringe you want to see in the world",
    ],

    tryAgain: [
        "Try Again (maybe it'll work this time... probably not)",
        "Retry? You're optimistic.",
        "Try again. Third time's the charm... or fourth... or fifth...",
    ],

    signIn: [
        "Sign In (if you dare)",
        "Login to unlock more cringe",
        "Enter the cringeverse",
    ],

    signOut: [
        "Sign Out (running away?)",
        "Logout (we'll miss roasting you)",
        "Exit (the cringe follows you)",
    ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getRoast = {
    loading: (type: keyof typeof loadingRoasts = 'general') => random(loadingRoasts[type]),
    empty: (type: keyof typeof emptyRoasts) => random(emptyRoasts[type]),
    error: (type: keyof typeof errorRoasts = 'general') => random(errorRoasts[type]),
    success: (type: keyof typeof successRoasts) => random(successRoasts[type]),
    profile: (type: keyof typeof profileRoasts) => random(profileRoasts[type]),
    action: (type: keyof typeof actionRoasts) => random(actionRoasts[type]),
};

export default getRoast;
