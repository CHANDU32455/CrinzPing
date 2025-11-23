import { Link } from "react-router-dom";

// About Tab Component - Redesigned for a roasting platform (Mobile optimized)
export function About() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 px-3 sm:px-4 py-6 sm:py-8">
            {/* Header with attitude */}
            <div className="text-center mb-8 sm:mb-12 relative">
                <div className="inline-block">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-2 sm:mb-3 animate-pulse px-2">
                        💀 ABOUT CRINZ 💀
                    </h1>
                    <p className="text-gray-400 text-base sm:text-lg italic px-2">
                        Where your ego comes to die
                    </p>
                </div>
                {/* Hide decorative emojis on very small screens */}
                <div className="hidden sm:block absolute top-0 right-0 text-2xl sm:text-4xl animate-bounce">🔥</div>
                <div className="hidden sm:block absolute bottom-0 left-0 text-2xl sm:text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>💩</div>
            </div>

            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                {/* About Section */}
                <div className="group relative bg-gradient-to-br from-red-900/20 via-gray-900/50 to-orange-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-red-500/30 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02]">
                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-2xl sm:text-3xl group-hover:rotate-12 transition-transform">
                        🎯
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl">🎪</span>
                        What's This Circus?
                    </h2>

                    <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
                        <span className="font-bold text-orange-400">Crinz</span> is where savage roasts meet unfiltered truth.
                        No safe spaces, no participation trophies. Just pure, unadulterated <span className="italic text-red-400">chaos</span>.
                    </p>

                    <div className="bg-black/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-900/50">
                        <div className="flex justify-between items-center py-2 border-b border-gray-800 text-sm sm:text-base">
                            <span className="text-gray-400 font-semibold">Version</span>
                            <span className="text-red-400 font-bold font-mono">v1.0.0-SAVAGE</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-sm sm:text-base">
                            <span className="text-gray-400 font-semibold">Vibe Check</span>
                            <span className="text-orange-400 font-bold">UNHINGED 🔥</span>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                    <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl">⚡</span>
                        What We Do
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-black/40 rounded-lg p-3 sm:p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-125 transition-transform inline-block">💬</div>
                            <p className="text-gray-300 text-sm sm:text-base"><span className="font-bold text-purple-400">Roast</span> your friends (or enemies)</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3 sm:p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-125 transition-transform inline-block">🎭</div>
                            <p className="text-gray-300 text-sm sm:text-base"><span className="font-bold text-purple-400">Share</span> spicy content</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3 sm:p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-125 transition-transform inline-block">👁️</div>
                            <p className="text-gray-300 text-sm sm:text-base"><span className="font-bold text-purple-400">Watch</span> drama unfold</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3 sm:p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-125 transition-transform inline-block">😈</div>
                            <p className="text-gray-300 text-sm sm:text-base"><span className="font-bold text-purple-400">Laugh</span> at the chaos</p>
                        </div>
                    </div>
                </div>

                {/* Support */}
                <div className="bg-gradient-to-br from-blue-900/20 via-gray-900/50 to-cyan-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-500/30 hover:border-blue-500 transition-all duration-300">
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-400 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl">🆘</span>
                        Need Help? (We're Shocked Too)
                    </h2>

                    <div className="space-y-2 sm:space-y-3">
                        <a
                            href="mailto:support@crinz.com"
                            className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-800/50 hover:to-cyan-800/50 rounded-lg sm:rounded-xl transition-all border border-blue-700/50 hover:border-blue-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <span className="text-2xl sm:text-3xl group-hover:animate-bounce">📧</span>
                                <div>
                                    <span className="font-bold text-white block text-sm sm:text-base">Contact Support</span>
                                    <span className="text-xs text-gray-400 italic hidden sm:inline">We might actually respond...</span>
                                </div>
                            </div>
                            <span className="text-blue-400 group-hover:translate-x-2 transition-transform text-sm sm:text-base">→</span>
                        </a>

                        <Link
                            to="/help"
                            className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-800/50 hover:to-cyan-800/50 rounded-lg sm:rounded-xl transition-all border border-blue-700/50 hover:border-blue-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <span className="text-2xl sm:text-3xl group-hover:animate-spin">📖</span>
                                <div>
                                    <span className="font-bold text-white block text-sm sm:text-base">Help Center</span>
                                    <span className="text-xs text-gray-400 italic hidden sm:inline">For the confused souls</span>
                                </div>
                            </div>
                            <span className="text-blue-400 group-hover:translate-x-2 transition-transform text-sm sm:text-base">→</span>
                        </Link>
                    </div>
                </div>

                {/* Legal (with sass) */}
                <div className="bg-gradient-to-br from-yellow-900/20 via-gray-900/50 to-amber-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-yellow-500/30 hover:border-yellow-500 transition-all duration-300">
                    <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl">⚖️</span>
                        The Boring Stuff
                    </h2>

                    <div className="space-y-2 sm:space-y-3">
                        <Link
                            to="/terms"
                            className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 hover:from-yellow-800/50 hover:to-amber-800/50 rounded-lg sm:rounded-xl transition-all border border-yellow-700/50 hover:border-yellow-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <span className="text-2xl sm:text-3xl group-hover:rotate-12 transition-transform inline-block">📜</span>
                                <div>
                                    <span className="font-bold text-white block text-sm sm:text-base">Terms of Service</span>
                                    <span className="text-xs text-gray-400 italic hidden sm:inline">The rules nobody reads</span>
                                </div>
                            </div>
                            <span className="text-yellow-400 group-hover:translate-x-2 transition-transform text-sm sm:text-base">→</span>
                        </Link>

                        <Link
                            to="/privacySettings"
                            className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 hover:from-yellow-800/50 hover:to-amber-800/50 rounded-lg sm:rounded-xl transition-all border border-yellow-700/50 hover:border-yellow-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform inline-block">🔒</span>
                                <div>
                                    <span className="font-bold text-white block text-sm sm:text-base">Privacy Policy</span>
                                    <span className="text-xs text-gray-400 italic hidden sm:inline">Your secrets are safe-ish</span>
                                </div>
                            </div>
                            <span className="text-yellow-400 group-hover:translate-x-2 transition-transform text-sm sm:text-base">→</span>
                        </Link>
                    </div>
                </div>

                {/* Footer tagline */}
                <div className="text-center py-6 sm:py-8">
                    <p className="text-gray-500 italic text-xs sm:text-sm px-4">
                        "Where savage meets digital" - Some random user, probably
                    </p>
                    <div className="flex justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xl sm:text-2xl">
                        <span className="hover:scale-150 transition-transform cursor-pointer">💀</span>
                        <span className="hover:scale-150 transition-transform cursor-pointer">🔥</span>
                        <span className="hover:scale-150 transition-transform cursor-pointer">😈</span>
                        <span className="hover:scale-150 transition-transform cursor-pointer">💯</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
