export const metadata = { title: "Terms of Service • PurrAssist" };

export default function TermsPage() {
  const effective = "17 September 2025";
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 pb-12 prose prose-zinc dark:prose-invert">
      <h1>Terms of Service</h1>
      <p><strong>Effective:</strong> {effective}</p>

      <p>
        Welcome to <strong>PurrAssist</strong>. By accessing or using our Service,
        you agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old and a college student in India (or otherwise authorized)
        to use PurrAssist. We may require student verification.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Keep your credentials confidential. You’re responsible for activity on your account.</li>
        <li>Provide accurate information and keep it up to date.</li>
      </ul>

      <h2>Subscriptions & billing</h2>
      <ul>
        <li>Paid plans renew until cancelled. Prices may change with notice.</li>
        <li>Taxes may apply. Refunds are handled per plan terms and applicable law.</li>
        <li>Payment processing is provided by our third-party gateway.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>No harassment, hate speech, threats, discrimination, sexual exploitation, or illegal activity.</li>
        <li>No nudity or sexually explicit content. No sharing of others’ private information without consent.</li>
        <li>No impersonation, fraud, or intellectual-property infringement.</li>
        <li>No attempts to bypass safety features, scrape, or reverse engineer the Service.</li>
        <li>Follow all applicable laws and campus codes of conduct.</li>
      </ul>

      <h2>Safety & moderation</h2>
      <p>
        We may investigate and take action (including warnings, feature limits, or account termination)
        for violations. We may cooperate with law enforcement where legally required.
        Use in India is subject to the IT Act, 2000 and relevant Rules.
      </p>

      <h2>Content</h2>
      <p>
        You own your content. You grant us a limited, worldwide, non-exclusive, royalty-free license
        to host and display it to operate the Service. You represent you have the rights to the content you share.
      </p>

      <h2>Privacy</h2>
      <p>
        Our <a href="/privacy">Privacy Policy</a> explains how we collect and process your data.
      </p>

      <h2>Service changes</h2>
      <p>
        We may modify, suspend, or discontinue features at any time with or without notice.
      </p>

      <h2>Disclaimers</h2>
      <p>
        The Service is provided “as is” and “as available”. We disclaim warranties of merchantability,
        fitness for a particular purpose, and non-infringement to the maximum extent permitted by law.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, PurrAssist shall not be liable for indirect, incidental,
        special, consequential, or punitive damages, or any loss of profits or data. Our aggregate
        liability for any claims relating to the Service shall not exceed the amount you paid to us in the
        6 months preceding the claim (or INR 5,000 if you are on the free plan).
      </p>

      <h2>Indemnity</h2>
      <p>
        You agree to indemnify and hold PurrAssist harmless from claims arising out of your use of the Service
        or violation of these Terms.
      </p>

      <h2>Governing law & disputes</h2>
      <p>
        These Terms are governed by the laws of India. Subject to applicable consumer protection law,
        the courts at [City, State], India shall have exclusive jurisdiction. (Replace with your city.)
      </p>

      <h2>Changes to Terms</h2>
      <p>We may update these Terms. Continued use means you accept the changes.</p>

      <h2>Contact</h2>
      <p>
        Email: <a href="mailto:support@purrassist.app">support@purrassist.app</a>
      </p>
    </main>
  );
}
