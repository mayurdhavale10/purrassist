export const metadata = { title: "Cookie Policy • PurrAssist" };

export default function CookiesPage() {
  const effective = "17 September 2025";
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 pb-12 prose prose-zinc dark:prose-invert">
      <h1>Cookie Policy</h1>
      <p><strong>Effective:</strong> {effective}</p>

      <p>
        This policy explains how PurrAssist uses cookies and similar technologies on our website and app.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Small text files placed on your device to store data. We also use localStorage and similar tech.
      </p>

      <h2>Types we use</h2>
      <ul>
        <li><strong>Essential:</strong> sign-in, session security, fraud prevention.</li>
        <li><strong>Preferences:</strong> theme, language, in-app settings.</li>
        <li><strong>Analytics:</strong> usage trends to improve the Service (aggregated/limited).</li>
        <li><strong>Marketing (limited):</strong> only if you consent; used to measure campaigns.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>Use your browser settings to block or delete cookies.</li>
        <li>If we show a cookie banner, use it to manage non-essential cookies.</li>
        <li>Blocking some cookies may break parts of the Service.</li>
      </ul>

      <h2>Retention</h2>
      <p>Cookies last from a session to up to 13 months, depending on purpose.</p>

      <h2>Third parties</h2>
      <p>
        We may use reputable providers for analytics/performance. Their use is governed by their policies
        and our data processing agreements.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? <a href="mailto:support@purrassist.app">support@purrassist.app</a>
      </p>
    </main>
  );
}
