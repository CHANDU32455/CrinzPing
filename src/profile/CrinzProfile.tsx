import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useUserDetails } from '../hooks/UserInfo';
import { FloatingActionButton } from '../components/ActionButtons';
import useFollow from './following/useFollow';
import { UserMemes } from './profilePosts';
import UserReels from './profileReels';
import { About, Settings } from './excess';

const DEFAULT_AVATAR = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <rect width="120" height="120" fill="#1a202c"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#4a5568">No Image</text>
</svg>`);

const CrinzProfile: React.FC = () => {
    const { sub } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = useAuth();

    // Main tabs state (Profile, About, Settings)
    const [mainActiveTab, setMainActiveTab] = useState<'profile' | 'about' | 'settings'>('profile');
    // Inner tabs state (Messages, Posts, Reels) - only for profile tab
    const [innerActiveTab, setInnerActiveTab] = useState<'messages' | 'posts' | 'reels'>('messages');

    const [copied, setCopied] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [shouldRedirectToSetup, setShouldRedirectToSetup] = useState(false);
    const [showPicModal, setShowPicModal] = useState(false);

    // Determine if viewing own profile or others
    const isOwnProfile = !sub || sub === auth.user?.profile?.sub;

    // Get the correct profile sub
    const profileSub = React.useMemo(() => {
        if (sub) return sub; // Other user's profile
        if (auth.isAuthenticated && auth.user?.profile?.sub) return auth.user.profile.sub; // Own profile
        return undefined; // Not available yet
    }, [sub, auth.isAuthenticated, auth.user?.profile?.sub]);

    // Single data fetch for everything - only call if profileSub exists
    const { userDetails, crinzMessages, loadingUser, loadingCrinz, userError } = useUserDetails(profileSub);

    // Follow system - call for ALL profiles (both own and others)
    const { stats, loading: loadingFollow, toggleFollow } = useFollow(profileSub);

    // Set initial tab from URL
    useEffect(() => {
        const tab = searchParams.get('content');
        if (tab === 'posts' || tab === 'reels') {
            setInnerActiveTab(tab);
        }
    }, [searchParams]);

    // Redirect logic - check for 404 errors and handle properly
    useEffect(() => {
        if (isOwnProfile && auth.isAuthenticated && profileSub) {
            // If we're done loading and still no user details, check the error
            if (!loadingUser && !userDetails) {
                // Check if it's a 404 error (user not found in database)
                if (userError?.response?.status === 404) {
                    setShouldRedirectToSetup(true);
                }
            }

            // If we have user details, clear any pending redirect
            if (userDetails) {
                setShouldRedirectToSetup(false);
            }
        }
    }, [isOwnProfile, auth.isAuthenticated, loadingUser, userDetails, profileSub, userError]);

    // Actually perform the redirect in a separate effect
    useEffect(() => {
        if (shouldRedirectToSetup) {
            navigate("/postUserDetails", { replace: true });
        }
    }, [shouldRedirectToSetup, navigate]);

    // Main tab change
    const handleMainTabChange = (tab: string) => {
        if (tab === 'profile' || tab === 'about' || tab === 'settings') {
            setMainActiveTab(tab);
        }
    };

    // Inner tab change
    const handleInnerTabChange = (tab: string) => {
        if (tab === 'messages' || tab === 'posts' || tab === 'reels') {
            setInnerActiveTab(tab);
        }
    };

    // Share profile
    const shareProfile = () => {
        if (!userDetails?.userId) return;
        const shareUrl = `${window.location.origin}/profile/${userDetails.userId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Edit profile
    const handleEdit = () => {
        navigate("/postUserDetails", { state: { userDetails } });
    };

    // Follow/unfollow
    const handleFollowToggle = async () => {
        if (isOwnProfile || !profileSub) return;

        setIsProcessingFollow(true);
        await toggleFollow(profileSub);
        setIsProcessingFollow(false);
    };

    // View followers/following
    const handleShowFollowers = () => {
        if (userDetails?.userId && isOwnProfile) {
            navigate(`/profile/${userDetails.userId}/followers`);
        }
    };

    const handleShowFollowing = () => {
        if (userDetails?.userId && isOwnProfile) {
            navigate(`/profile/${userDetails.userId}/following`);
        }
    };

    // Post click
    const handlePostClick = (post: any) => {
        navigate(`/profile/${userDetails?.userId}/more?highlight=${post.crinzId}`);
    };

    // Show loading while auth is initializing
    if (auth.isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-300">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show sign in prompt for own profile when not authenticated
    if (isOwnProfile && !auth.isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <button
                        onClick={() => auth.signinRedirect()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Sign In to View Profile
                    </button>
                </div>
            </div>
        );
    }

    // Show loading while waiting for profileSub or user data
    if (!profileSub || loadingUser) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-300">
                        {!profileSub ? 'Getting user info...' : 'Loading profile...'}
                    </p>
                </div>
            </div>
        );
    }

    // User not found - only show for other users' profiles
    if (!userDetails && !isOwnProfile) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😵</div>
                    <h1 className="text-2xl text-white font-bold mb-2">Profile Not Found</h1>
                    <p className="text-purple-300">This user might have deleted their account</p>
                </div>
            </div>
        );
    }

    // If we're about to redirect, show a loading state
    if (shouldRedirectToSetup) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-300">Setting up your profile...</p>
                </div>
            </div>
        );
    }

    // If we get here and still no userDetails but no redirect, show error
    if (isOwnProfile && !userDetails && !shouldRedirectToSetup) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl text-white font-bold mb-2">Profile Error</h1>
                    <p className="text-purple-300 mb-4">Unable to load your profile</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const mainTabs = [
        { id: 'profile', label: 'PROFILE' },
        { id: 'about', label: 'ABOUT' },
        { id: 'settings', label: 'SETTINGS' }
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Main Tabs Navigation - Built directly here */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center">
                        <div className="flex space-x-8 p-4">
                            {mainTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleMainTabChange(tab.id)}
                                    className={`px-2 py-2 font-semibold text-sm transition-all border-b-2 ${mainActiveTab === tab.id
                                        ? 'border-purple-500 text-purple-300'
                                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Header - Only show when main tab is 'profile' */}
            {mainActiveTab === 'profile' && (
                <div className="relative bg-gradient-to-b from-purple-900/30 to-black border-b border-purple-500/20">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="flex flex-wrap items-start gap-6">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                                <div
                                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-1 cursor-pointer"
                                    onClick={() => setShowPicModal(true)} >
                                    <img
                                        src={userDetails?.profilePic || DEFAULT_AVATAR}
                                        alt="Profile"
                                        className="w-full h-full rounded-2xl object-cover bg-black"
                                    />
                                </div>
                            </div>

                            {showPicModal && (
                                <div
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                                    onClick={() => setShowPicModal(false)}
                                >
                                    <div
                                        className="relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <img
                                            src={userDetails?.profilePic || DEFAULT_AVATAR}
                                            alt="Profile Large"
                                            className="max-w-[90vw] max-h-[80vh] rounded-2xl object-cover shadow-2xl scale-100 animate-zoomIn"
                                        />

                                        <button
                                            onClick={() => setShowPicModal(false)}
                                            className="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Profile Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center space-x-3">
                                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                            {userDetails?.displayName || 'Anonymous Cringer'}
                                        </h1>
                                        {isOwnProfile && (
                                            <button
                                                onClick={shareProfile}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${copied
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                                                    }`}
                                            >
                                                {copied ? 'COPIED!' : 'SHARE'}
                                            </button>
                                        )}
                                    </div>

                                    {isOwnProfile && (
                                        <button
                                            onClick={handleEdit}
                                            className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                                            title="Edit Profile"
                                        >
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Tagline */}
                                <p className="text-gray-300 mb-4 text-sm">
                                    {userDetails?.Tagline || 'No tagline set... typical cringer behavior'}
                                </p>

                                {/* Follow Stats - FIXED LAYOUT */}
                                <div className="flex flex-wrap items-center gap-6 max-w-full">
                                    <div
                                        className={`text-center ${isOwnProfile ? 'cursor-pointer hover:text-purple-300' : ''}`}
                                        onClick={handleShowFollowers}
                                    >
                                        <div className="text-white font-bold text-lg">
                                            {loadingFollow ? '...' : stats?.followersCount?.toLocaleString() || '0'}
                                        </div>
                                        <div className="text-gray-400 text-xs">FOLLOWERS</div>
                                    </div>

                                    <div
                                        className={`text-center ${isOwnProfile ? 'cursor-pointer hover:text-purple-300' : ''}`}
                                        onClick={handleShowFollowing}
                                    >
                                        <div className="text-white font-bold text-lg">
                                            {loadingFollow ? '...' : stats?.followingCount?.toLocaleString() || '0'}
                                        </div>
                                        <div className="text-gray-400 text-xs">FOLLOWING</div>
                                    </div>

                                    {/* Follow Button - FIXED WIDTH to prevent layout shift */}
                                    {!isOwnProfile && (
                                        <div className="min-w-[100px]"> {/* Fixed width container */}
                                            <button
                                                onClick={handleFollowToggle}
                                                disabled={isProcessingFollow}
                                                className={`w-full px-6 py-2 rounded-full font-semibold text-sm transition-colors ${stats?.isFollowing
                                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                                                    } ${isProcessingFollow ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <span className="inline-block min-w-[60px] text-center">
                                                    {isProcessingFollow ? '...' : stats?.isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto px-4">

                {/* Inner Tabs - Only show when main tab is 'profile' */}
                {mainActiveTab === 'profile' && (
                    <>
                        <div className="flex border-b border-gray-800">
                            {(['messages', 'posts', 'reels'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => handleInnerTabChange(tab)}
                                    className={`px-6 py-4 font-semibold text-sm border-b-2 transition-all ${innerActiveTab === tab
                                        ? 'border-purple-500 text-purple-300'
                                        : 'border-transparent text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="py-6">
                            {/* Messages Tab */}
                            {innerActiveTab === 'messages' && (
                                <div className="space-y-3">
                                    {loadingCrinz ? (
                                        <div className="text-center py-8">
                                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                            <p className="text-gray-400 text-sm">Loading crinz...</p>
                                        </div>
                                    ) : !crinzMessages || crinzMessages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-3">😴</div>
                                            <p className="text-gray-400">No crinz yet. So empty...</p>
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => navigate('/contributeCrinz')}
                                                    className="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    CREATE FIRST CRI NZ
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        crinzMessages.slice(0, 10).map(post => (
                                            <div
                                                key={post.crinzId}
                                                onClick={() => handlePostClick(post)}
                                                className="bg-gray-900/50 hover:bg-gray-800/50 rounded-xl p-4 cursor-pointer transition-all border border-gray-800 hover:border-purple-500/30"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-purple-300 font-semibold text-sm">
                                                        @{userDetails?.displayName?.toLowerCase() || 'user'}
                                                    </span>
                                                    <div className="flex space-x-3 text-xs text-gray-400">
                                                        <span>❤️ {post.likeCount || 0}</span>
                                                        <span>💬 {post.commentCount || 0}</span>
                                                    </div>
                                                </div>
                                                <p className="text-white text-sm leading-relaxed">
                                                    {post.message}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Posts Tab */}
                            {innerActiveTab === 'posts' && (
                                <div>
                                    <UserMemes
                                        userId={userDetails?.userId}
                                        currentUserId={isOwnProfile ? auth.user?.profile?.sub : undefined}
                                        previewMode={true}
                                    />
                                </div>
                            )}

                            {/* Reels Tab */}
                            {innerActiveTab === 'reels' && (
                                <div>
                                    <UserReels
                                        userId={userDetails?.userId}
                                        currentUserId={isOwnProfile ? auth.user?.profile?.sub : undefined}
                                        previewMode={true}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* About Tab Content */}
                {mainActiveTab === 'about' && (
                    <div className="py-6">
                        <About />
                    </div>
                )}

                {/* Settings Tab Content */}
                {mainActiveTab === 'settings' && (
                    <div className="py-6">
                        <Settings />
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            {isOwnProfile && mainActiveTab === 'profile' && (
                <div className="fixed bottom-6 right-6">
                    <FloatingActionButton />
                </div>
            )}
        </div>
    );
};

export default CrinzProfile;