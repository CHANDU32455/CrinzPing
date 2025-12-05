import { PrivacySEO } from "../components/shared/seoContent";

const PrivacySettingsPage = () => {
  const currentDate = new Date().toLocaleDateString();

  return (
    <>
      <PrivacySEO />
      <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12 font-sans">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Privacy Policy
          </h1 >
          <p className="text-gray-400">
            Last updated: {currentDate}
          </p>
        </div >

        {/* Introduction */}
        < section className="mb-10" >
          <p className="text-gray-300 text-lg leading-relaxed">
            At <span className="text-purple-400 font-semibold">CrinzPing</span>, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our social media platform.
          </p>
        </section >

        {/* Information We Collect */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">📋</span> Information We Collect
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Account details: username, email address, display name, profile picture
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Profile information: tagline, bio, preferences you choose to share
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Authentication data through our secure OAuth provider (Cognito)
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-white mb-3 mt-6">Content You Create</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Crinz messages, posts, reels, and other content you share
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Images, videos, and audio files you upload
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Comments, likes, and interactions with other users
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-white mb-3 mt-6">Usage Data</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Device information: browser type, device type, operating system
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Log data: IP address, access times, pages viewed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Analytics data to improve user experience (anonymized)
              </li>
            </ul>
          </div>
        </section >

        {/* How We Use Your Information */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">🔧</span> How We Use Your Information
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Provide, maintain, and improve our services
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Personalize your experience and content feed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Process and display your content to other users
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Send important notifications about your account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Analyze usage patterns to improve the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                Ensure platform security and prevent abuse
              </li>
            </ul>
          </div>
        </section >

        {/* Data Storage & Security */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">🔒</span> Data Storage & Security
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Your data is stored securely using AWS infrastructure (DynamoDB, S3)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Media files are encrypted in transit and at rest
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                We use secure authentication via AWS Cognito
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Access to user data is strictly controlled and logged
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                We implement industry-standard security practices
              </li>
            </ul>
          </div>
        </section >

        {/* Data Sharing */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">🤝</span> Data Sharing
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4 font-semibold text-lg">We do NOT sell your personal data.</p>
            <p className="text-gray-300 mb-4">We may share information only in these circumstances:</p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>With your consent:</strong> When you explicitly agree to sharing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>Public content:</strong> Content you post publicly is visible to all users
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>Service providers:</strong> AWS services that help us operate the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>Legal requirements:</strong> When required by law or to protect rights
              </li>
            </ul>
          </div>
        </section >

        {/* Your Rights */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">⚖️</span> Your Rights
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <strong>Correction:</strong> Update or correct inaccurate information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <strong>Portability:</strong> Request your data in a portable format
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <strong>Visibility control:</strong> Set your posts as public or private
              </li>
            </ul>
          </div>
        </section >

        {/* Cookies */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">🍪</span> Cookies & Local Storage
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              We use cookies and local storage to:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Keep you signed in and maintain your session
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Remember your preferences (theme, mute settings, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Improve performance and user experience
              </li>
            </ul>
          </div>
        </section >

        {/* Contact */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">📧</span> Contact Us
          </h2>
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
            <p className="text-gray-300 mb-4">
              If you have questions about this Privacy Policy or want to exercise your rights, please contact us:
            </p>
            <p className="text-purple-300 font-semibold">
              Email: support@crinzping.com
            </p>
          </div>
        </section >

        {/* Footer */}
        < div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800" >
          <p>© {new Date().getFullYear()} CrinzPing. All rights reserved.</p>
          <p className="mt-2">This policy is effective as of {currentDate}.</p>
        </div >
      </div >
    </>
  );
};

export default PrivacySettingsPage;
