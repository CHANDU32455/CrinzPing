import React from "react";
import { Link } from "react-router-dom";

// About Tab Component - Redesigned for a roasting platform
export function About() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 px-4 py-8">
            {/* Header with attitude */}
            <div className="text-center mb-12 relative">
                <div className="inline-block">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-3 animate-pulse">
                        💀 ABOUT CRINZ 💀
                    </h1>
                    <p className="text-gray-400 text-lg italic">
                        Where your ego comes to die
                    </p>
                </div>
                <div className="absolute top-0 right-0 text-4xl animate-bounce">🔥</div>
                <div className="absolute bottom-0 left-0 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>💩</div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* About Section */}
                <div className="group relative bg-gradient-to-br from-red-900/20 via-gray-900/50 to-orange-900/20 rounded-2xl p-6 border-2 border-red-500/30 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02]">
                    <div className="absolute -top-3 -right-3 text-3xl group-hover:rotate-12 transition-transform">
                        🎯
                    </div>

                    <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span className="text-3xl">🎪</span>
                        What's This Circus?
                    </h2>

                    <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                        <span className="font-bold text-orange-400">Crinz</span> is where savage roasts meet unfiltered truth.
                        No safe spaces, no participation trophies. Just pure, unadulterated <span className="italic text-red-400">chaos</span>.
                    </p>

                    <div className="bg-black/50 rounded-xl p-4 border border-red-900/50">
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                            <span className="text-gray-400 font-semibold">Version</span>
                            <span className="text-red-400 font-bold font-mono">v1.0.0-SAVAGE</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-400 font-semibold">Vibe Check</span>
                            <span className="text-orange-400 font-bold">UNHINGED 🔥</span>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-pink-900/20 rounded-2xl p-6 border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                    <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                        <span className="text-3xl">⚡</span>
                        What We Do
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-black/40 rounded-lg p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-2xl mb-2 group-hover:scale-125 transition-transform inline-block">💬</div>
                            <p className="text-gray-300"><span className="font-bold text-purple-400">Roast</span> your friends (or enemies)</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-2xl mb-2 group-hover:scale-125 transition-transform inline-block">🎭</div>
                            <p className="text-gray-300"><span className="font-bold text-purple-400">Share</span> spicy content</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-2xl mb-2 group-hover:scale-125 transition-transform inline-block">👁️</div>
                            <p className="text-gray-300"><span className="font-bold text-purple-400">Watch</span> drama unfold</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-4 border border-purple-800/50 hover:border-purple-500 transition-all group">
                            <div className="text-2xl mb-2 group-hover:scale-125 transition-transform inline-block">😈</div>
                            <p className="text-gray-300"><span className="font-bold text-purple-400">Laugh</span> at the chaos</p>
                        </div>
                    </div>
                </div>

                {/* Support */}
                <div className="bg-gradient-to-br from-blue-900/20 via-gray-900/50 to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-500/30 hover:border-blue-500 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="text-3xl">🆘</span>
                        Need Help? (We're Shocked Too)
                    </h2>

                    <div className="space-y-3">
                        <a
                            href="mailto:support@crinz.com"
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-800/50 hover:to-cyan-800/50 rounded-xl transition-all border border-blue-700/50 hover:border-blue-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl group-hover:animate-bounce">📧</span>
                                <div>
                                    <span className="font-bold text-white block">Contact Support</span>
                                    <span className="text-xs text-gray-400 italic">We might actually respond...</span>
                                </div>
                            </div>
                            <span className="text-blue-400 group-hover:translate-x-2 transition-transform">→</span>
                        </a>

                        <a
                            href="/help"
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-800/50 hover:to-cyan-800/50 rounded-xl transition-all border border-blue-700/50 hover:border-blue-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl group-hover:animate-spin">📖</span>
                                <div>
                                    <span className="font-bold text-white block">Help Center</span>
                                    <span className="text-xs text-gray-400 italic">For the confused souls</span>
                                </div>
                            </div>
                            <span className="text-blue-400 group-hover:translate-x-2 transition-transform">→</span>
                        </a>
                    </div>
                </div>

                {/* Legal (with sass) */}
                <div className="bg-gradient-to-br from-yellow-900/20 via-gray-900/50 to-amber-900/20 rounded-2xl p-6 border-2 border-yellow-500/30 hover:border-yellow-500 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span className="text-3xl">⚖️</span>
                        The Boring Stuff
                    </h2>

                    <div className="space-y-3">
                        <Link
                            to="/terms"
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 hover:from-yellow-800/50 hover:to-amber-800/50 rounded-xl transition-all border border-yellow-700/50 hover:border-yellow-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl group-hover:rotate-12 transition-transform inline-block">📜</span>
                                <div>
                                    <span className="font-bold text-white block">Terms of Service</span>
                                    <span className="text-xs text-gray-400 italic">The rules nobody reads</span>
                                </div>
                            </div>
                            <span className="text-yellow-400 group-hover:translate-x-2 transition-transform">→</span>
                        </Link>

                        <Link
                            to="/privacy"
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 hover:from-yellow-800/50 hover:to-amber-800/50 rounded-xl transition-all border border-yellow-700/50 hover:border-yellow-500 hover:scale-[1.02] group"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl group-hover:scale-110 transition-transform inline-block">🔒</span>
                                <div>
                                    <span className="font-bold text-white block">Privacy Policy</span>
                                    <span className="text-xs text-gray-400 italic">Your secrets are safe-ish</span>
                                </div>
                            </div>
                            <span className="text-yellow-400 group-hover:translate-x-2 transition-transform">→</span>
                        </Link>
                    </div>
                </div>

                {/* Footer tagline */}
                <div className="text-center py-8">
                    <p className="text-gray-500 italic text-sm">
                        "Where savage meets digital" - Some random user, probably
                    </p>
                    <div className="flex justify-center gap-4 mt-4 text-2xl">
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
