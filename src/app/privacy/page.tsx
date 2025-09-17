/* Replace COMPANY details below before going live */

export const metadata = {
  title: "Privacy Policy • PurrAssist",
};

export default function PrivacyPage() {
  const effective = "17 September 2025"; // update when you change this doc
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 pb-12 prose prose-zinc dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p><strong>Effective:</strong> {effective}</p>
      <p>
        This Privacy Policy explains how <strong>PurrAssist</strong> (“we”, “us”,
        “our”) collects, uses, shares, and protects your information when you
        use our website, mobile or web app, products, and services
        (collectively, the “Service”).
      </p>
      <p className="text-sm">
        Note: This policy reflects obligations under India’s{" "}
        <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>{" "}
        and the <strong>Information Technology (Reasonable Security Practices
        and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>,
        read with the <strong>Information Technology (Intermediary Guidelines and
        Digital Media Ethics Code) Rules, 2021</strong>. It is provided for your convenience and
        is not legal advice.
      </p>

      <h2>Who we are & contact</h2>
      <ul>
        <li><strong>Data Fiduciary:</strong> PurrAssist (replace with your legal company name)</li>
        <li><strong>Registered Address:</strong> [Company Address]</li>
        <li><strong>Email:</strong> support@purrassist.app</li>
        <li><strong>Grievance Officer (IT Act, 2000):</strong> [Name], <a href="mailto:grievance@purrassist.app">grievance@purrassist.app</a></li>
        <li><strong>Data Protection Officer (DPDP Act):</strong> [Name], <a href="mailto:dpo@purrassist.app">dpo@purrassist.app</a></li>
      </ul>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account & Verification:</strong> name, email, college/institute, year/department, and optional profile info.</li>
        <li><strong>Usage & Device:</strong> IP address, device identifiers, browser type, crash logs, and basic analytics.</li>
        <li><strong>Interactions:</strong> matches, connection preferences, limited session metadata (start/end timestamps, peers connected).</li>
        <li><strong>Support & Reports:</strong> messages you send to support; content you flag/report (for moderation & safety).</li>
        <li><strong>Payments:</strong> plan choice and billing status via our payment gateway; we do not store full card data.</li>
        <li><strong>Cookies & Similar Tech:</strong> see our Cookie Policy for details.</li>
      </ul>

      <h2>What we usually <em>do not</em> collect</h2>
      <p>
        We do not record or store your video/audio calls by default. Sessions
        are ephemeral and peer-to-peer where feasible. If a session is reported
        for abuse, we may temporarily retain evidence (e.g., screenshots, chat
        fragments) submitted by users or automatically captured safety signals,
        solely for trust & safety and legal compliance.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>Provide, operate, and improve the Service (matching, connections, discovery).</li>
        <li>Safety, security, fraud prevention, and moderation.</li>
        <li>Customer support and to respond to your requests.</li>
        <li>Communications (service notices, policy updates, receipts).</li>
        <li>Comply with laws and enforce our Terms.</li>
      </ul>

      <h2>Legal bases (DPDP Act)</h2>
      <ul>
        <li><strong>Consent:</strong> you give freely revocable consent for specific purposes.</li>
        <li><strong>Legitimate uses:</strong> prevention/detection of fraud, network and information security, compliance with law or court orders.</li>
        <li><strong>Contractual necessity:</strong> to deliver the Service you request (e.g., paid plans).</li>
      </ul>

      <h2>Your rights under the DPDP Act</h2>
      <ul>
        <li>Right to access information about processing.</li>
        <li>Right to correction and erasure of personal data.</li>
        <li>Right to grievance redressal.</li>
        <li>Right to nominate an individual to exercise your rights in case of death or incapacity.</li>
        <li>Right to withdraw consent (processing based on consent will cease thereafter).</li>
      </ul>
      <p>
        To exercise rights, email <a href="mailto:dpo@purrassist.app">dpo@purrassist.app</a>. We aim to respond within
        legally required timelines.
      </p>

      <h2>Children</h2>
      <p>
        PurrAssist is for users <strong>18+</strong> only. We do not knowingly process personal data of children
        (under 18 years per DPDP). If you believe a child has used the Service, contact
        <a href="mailto:grievance@purrassist.app"> grievance@purrassist.app</a>.
      </p>

      <h2>Sharing & transfers</h2>
      <ul>
        <li><strong>Vendors/Processors:</strong> hosting, analytics, payment, email. They process data under contracts and appropriate safeguards.</li>
        <li><strong>Legal & Safety:</strong> with authorities or third parties to comply with law, enforce terms, or protect users.</li>
        <li><strong>Cross-border transfers:</strong> your data may be processed outside India with comparable safeguards and purpose limitation as required.</li>
      </ul>

      <h2>Security</h2>
      <p>
        We implement reasonable technical and organizational measures (encryption in transit, access controls, logging). No system is 100% secure.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>Account data: while your account is active and for up to 24 months after deletion for fraud/legal compliance.</li>
        <li>Device/telemetry logs: typically 90 days unless extended for investigations.</li>
        <li>Reported-content evidence: retained only as long as necessary for resolution/legal obligations.</li>
      </ul>

      <h2>Cookies</h2>
      <p>See our <a href="/cookies">Cookie Policy</a> for how we use cookies and your choices.</p>

      <h2>Changes</h2>
      <p>
        We’ll update this page for material changes and, where required, notify you.
      </p>

      <h2>Grievance redressal</h2>
      
      <p>
        For concerns under the IT Act and Rules, email{" "}
        <a href="mailto:grievance@purrassist.app">grievance@purrassist.app</a>.
      </p>
    </main>
  );
}
