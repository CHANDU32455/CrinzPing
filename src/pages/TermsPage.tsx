import { TermsSEO } from "../components/shared/seoContent";

const TermsPage = () => {
  const currentDate = new Date().toLocaleDateString();

  return (
    <>
      <TermsSEO />
      <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12 font-sans">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Terms of Service
          </h1 >
          <p className="text-gray-400">
            Last updated: {currentDate}
          </p>
        </div >

        {/* Introduction */}
        < section className="mb-10" >
          <p className="text-gray-300 text-lg leading-relaxed">
            Welcome to <span className="text-purple-400 font-semibold">CrinzPing</span>! By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
          </p>
        </section >

        {/* Acceptance of Terms */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">📜</span> 1. Acceptance of Terms
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              By creating an account or using CrinzPing, you agree to:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                These Terms of Service and all applicable policies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Our Privacy Policy governing data collection and use
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Any future modifications to these terms (with continued use)
              </li>
            </ul>
          </div>
        </section >

        {/* Eligibility */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">👤</span> 2. Eligibility
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                You must be at least 13 years old to use CrinzPing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                If under 18, you must have parental/guardian consent
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                You must provide accurate and complete information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                You are responsible for maintaining account security
              </li>
            </ul>
          </div>
        </section >

        {/* User Conduct */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">⚡</span> 3. User Conduct
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4 font-semibold">You agree to use CrinzPing responsibly:</p>

            <h3 className="text-lg font-semibold text-green-400 mb-3">✅ DO</h3>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Share fun, entertaining, and original Crinz content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Respect other users and their content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Report inappropriate content using our tools
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                Keep your login credentials secure
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-red-400 mb-3">❌ DON'T</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Post hateful, violent, or discriminatory content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Harass, bully, or threaten other users
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Share illegal content or violate others' rights
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Spam, use bots, or manipulate the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Impersonate others or create fake accounts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Share sexually explicit or inappropriate content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Attempt to hack, exploit, or disrupt the service
              </li>
            </ul>
          </div>
        </section >

        {/* Content Ownership */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">📝</span> 4. Content Ownership & License
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>Your content:</strong> You retain ownership of content you create
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>License to us:</strong> By posting, you grant CrinzPing a non-exclusive, royalty-free license to display, distribute, and promote your content within the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>Public content:</strong> Content set to "public" can be viewed and shared by other users
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <strong>Removal:</strong> You can delete your content at any time
              </li>
            </ul>
          </div>
        </section >

        {/* Intellectual Property */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">©️</span> 5. Intellectual Property
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                CrinzPing name, logo, and branding are our trademarks
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                The platform's design, code, and features are protected
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                You may not copy, modify, or reverse-engineer our software
              </li>
            </ul>
          </div>
        </section >

        {/* Account Termination */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">🚫</span> 6. Account Termination
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">We may suspend or terminate your account if you:</p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Violate these Terms of Service
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Engage in prohibited conduct
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Create risk or legal exposure for CrinzPing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                Have been previously banned from the platform
              </li>
            </ul>
            <p className="text-gray-400 mt-4 text-sm">
              You may also delete your account at any time through your Settings page.
            </p>
          </div>
        </section >

        {/* Disclaimers */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span> 7. Disclaimers
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">!</span>
                CrinzPing is provided "as is" without warranties of any kind
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">!</span>
                We do not guarantee uninterrupted or error-free service
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">!</span>
                We are not responsible for user-generated content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">!</span>
                Features may change or be discontinued without notice
              </li>
            </ul>
          </div>
        </section >

        {/* Limitation of Liability */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">⚖️</span> 8. Limitation of Liability
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300">
              To the maximum extent permitted by law, CrinzPing shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, including but not limited to loss of data, loss of profits, or damages arising from user-generated content.
            </p>
          </div>
        </section >

        {/* Changes to Terms */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">🔄</span> 9. Changes to Terms
          </h2>
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                We may update these terms at any time
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Material changes will be notified via the platform or email
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Continued use after changes means acceptance of new terms
              </li>
            </ul>
          </div>
        </section >

        {/* Contact */}
        < section className="mb-10" >
          <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-2xl">📧</span> 10. Contact Us
          </h2>
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
            <p className="text-gray-300 mb-4">
              Questions about these Terms? Contact us:
            </p>
            <p className="text-purple-300 font-semibold">
              Email: support@crinzping.com
            </p>
          </div>
        </section >

        {/* Footer */}
        < div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800" >
          <p>© {new Date().getFullYear()} CrinzPing. All rights reserved.</p>
          <p className="mt-2">These terms are effective as of {currentDate}.</p>
        </div >
      </div >
    </>
  );
};

export default TermsPage;
