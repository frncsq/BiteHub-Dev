/**
 * KainGo legal documents content.
 *
 * These documents are TEMPLATES and do not constitute legal advice. Replace all
 * [ bracketed placeholders ] (entity name, address, emails, jurisdiction, fees,
 * settlement terms, dates) and have a qualified Philippine-licensed attorney
 * review them before publishing.
 *
 * Block types: { t: "p" | "ul" | "ol" | "callout" }.
 */

export const LEGAL_ORDER = [
  "terms",
  "privacy",
  "cookies",
  "refunds",
  "acceptable-use",
  "partner-agreement",
];

export const LEGAL_DOCS = {
  terms: {
    slug: "terms",
    title: "Terms of Service",
    short: "Terms of Service",
    summary:
      "The rules for using KainGo to discover restaurants, explore menus, and place food orders.",
    effective: "[Effective Date]",
    updated: "[Last Updated Date]",
    sections: [
      {
        id: "acceptance",
        heading: "1. Acceptance of These Terms",
        blocks: [
          {
            t: "p",
            text: "These Terms of Service ('Terms') govern your access to and use of the KainGo website, mobile applications, and related services (collectively, the 'Platform'), operated by [Legal Entity Name] ('KainGo', 'we', 'us', or 'our'). By creating an account, browsing, or placing an order, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.",
          },
          {
            t: "p",
            text: "These Terms incorporate by reference our Privacy Policy, Cookie Policy, Acceptable Use Policy, and Refund & Cancellation Policy.",
          },
        ],
      },
      {
        id: "definitions",
        heading: "2. Definitions",
        blocks: [
          {
            t: "ul",
            items: [
              "'Customer' means a user who browses restaurants or places orders.",
              "'Partner' or 'Restaurant Partner' means a restaurant or food business that registers to offer items on the Platform.",
              "'Order' means a request placed through the Platform for items from a Partner.",
              "'Content' means text, images, logos, menu data, reviews, and other materials on the Platform.",
            ],
          },
        ],
      },
      {
        id: "eligibility",
        heading: "3. Eligibility and Accounts",
        blocks: [
          {
            t: "p",
            text: "You must be at least eighteen (18) years old, or of legal age in your jurisdiction, to create an account and place orders. If you are below the required age, you may only use the Platform with the involvement of a parent or legal guardian who agrees to these Terms.",
          },
          {
            t: "ul",
            items: [
              "You agree to provide accurate, current, and complete information.",
              "You are responsible for keeping your account credentials confidential.",
              "You are responsible for all activity that occurs under your account.",
              "Notify us immediately at [Support Email] of any unauthorized use.",
            ],
          },
        ],
      },
      {
        id: "license",
        heading: "4. License to Use the Platform",
        blocks: [
          {
            t: "p",
            text: "Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to use the Platform for your personal, non-commercial use. You may not copy, modify, distribute, sell, sublicense, reverse engineer, or create derivative works of the Platform except as permitted by law.",
          },
        ],
      },
      {
        id: "partners",
        heading: "5. Restaurant Partners and Menu Information",
        blocks: [
          {
            t: "p",
            text: "Restaurants are independent businesses. Menu items, descriptions, prices, images, availability, and preparation details are provided by Partners. While we require Partners to keep this information accurate, we do not guarantee that it is error-free or always current. Partners may update or withdraw items, and prices may change before you confirm an order.",
          },
        ],
      },
      {
        id: "orders",
        heading: "6. Orders, Pricing, and Payment",
        blocks: [
          {
            t: "ul",
            items: [
              "An order is a request when you submit it, and is accepted when a Partner confirms it.",
              "Prices and applicable fees are shown at checkout. The total you confirm is the amount you agree to pay.",
              "Payment method and status are recorded with the order. KainGo does not itself process card payments unless a payment provider is expressly offered at checkout; where payment is made directly to a Partner or through a third-party provider, their terms also apply.",
              "You agree to pay all charges for orders placed under your account.",
            ],
          },
        ],
      },
      {
        id: "fulfillment",
        heading: "7. Fulfillment and Delivery",
        blocks: [
          {
            t: "p",
            text: "Fulfillment options (such as pickup or delivery) depend on the options a Partner offers and your location. Any timeframes shown are estimates only. Where a Partner or a third-party courier handles fulfillment, that party is responsible for that portion of the service.",
          },
        ],
      },
      {
        id: "refunds",
        heading: "8. Cancellations and Refunds",
        blocks: [
          {
            t: "p",
            text: "Cancellations and refunds are governed by our Refund & Cancellation Policy, which forms part of these Terms. Please review it before ordering.",
          },
        ],
      },
      {
        id: "conduct",
        heading: "9. Prohibited Conduct",
        blocks: [
          {
            t: "p",
            text: "Your use of the Platform is subject to our Acceptable Use Policy. Prohibited conduct includes, without limitation, fraudulent orders, unlawful activity, harassment, misuse of reviews, and attempts to disrupt or reverse engineer the Platform.",
          },
        ],
      },
      {
        id: "ip",
        heading: "10. Intellectual Property",
        blocks: [
          {
            t: "p",
            text: "The Platform, including the KainGo name, logo, design, software, and content we create, is owned by us or our licensors and protected by intellectual property laws. Partner names, logos, and menu content belong to the respective Partners. These Terms do not grant you any right to use our or any Partner's trademarks without permission.",
          },
        ],
      },
      {
        id: "third-party",
        heading: "11. Third-Party Services",
        blocks: [
          {
            t: "p",
            text: "The Platform may rely on or link to third-party services (for example, hosting, mapping, or payment providers). We are not responsible for the content, policies, or practices of third parties. Your use of third-party services may be governed by their own terms.",
          },
        ],
      },
      {
        id: "disclaimers",
        heading: "12. Disclaimers",
        blocks: [
          {
            t: "p",
            text: "The Platform is provided on an 'as is' and 'as available' basis. To the maximum extent permitted by law, we disclaim all warranties, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Platform will be uninterrupted, secure, or error-free, or that the quality, safety, or accuracy of any food or Partner service is guaranteed.",
          },
        ],
      },
      {
        id: "liability",
        heading: "13. Limitation of Liability",
        blocks: [
          {
            t: "p",
            text: "To the maximum extent permitted by law, KainGo and its officers, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill, arising out of or related to your use of the Platform. Our total aggregate liability for any claim will not exceed the greater of (a) the amount you paid for the order giving rise to the claim, or (b) [Liability Cap Amount].",
          },
          {
            t: "p",
            text: "Nothing in these Terms excludes or limits any liability that cannot be excluded or limited under applicable law, including applicable consumer protection provisions.",
          },
        ],
      },
      {
        id: "indemnity",
        heading: "14. Indemnification",
        blocks: [
          {
            t: "p",
            text: "You agree to indemnify and hold harmless KainGo and its officers, employees, and agents from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising from your use of the Platform, your violation of these Terms, or your violation of any rights of another party.",
          },
        ],
      },
      {
        id: "termination",
        heading: "15. Suspension and Termination",
        blocks: [
          {
            t: "p",
            text: "We may suspend or terminate your account or access at any time, with or without notice, if we believe you have violated these Terms or applicable law, or to protect the Platform or other users. You may stop using the Platform at any time.",
          },
        ],
      },
      {
        id: "governing-law",
        heading: "16. Governing Law and Dispute Resolution",
        blocks: [
          {
            t: "p",
            text: "These Terms are governed by the laws of the Republic of the Philippines, without regard to conflict-of-law principles. Subject to any mandatory consumer protections, the courts of [City], Philippines will have exclusive jurisdiction over disputes. The parties will attempt to resolve disputes amicably in good faith before resorting to formal proceedings.",
          },
        ],
      },
      {
        id: "changes",
        heading: "17. Changes to These Terms",
        blocks: [
          {
            t: "p",
            text: "We may update these Terms from time to time. Material changes will be posted on the Platform with a new effective date. Your continued use of the Platform after changes take effect constitutes acceptance of the updated Terms. If you do not agree, you should stop using the Platform.",
          },
        ],
      },
      {
        id: "contact",
        heading: "18. Contact",
        blocks: [
          {
            t: "p",
            text: "Questions about these Terms may be sent to [Legal Entity Name], [Business Address], or by email to [Support Email].",
          },
        ],
      },
    ],
  },

  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    short: "Privacy Policy",
    summary:
      "How KainGo collects, uses, shares, and protects your personal information under the Data Privacy Act of 2012.",
    effective: "[Effective Date]",
    updated: "[Last Updated Date]",
    sections: [
      {
        id: "introduction",
        heading: "1. Introduction",
        blocks: [
          {
            t: "p",
            text: "This Privacy Policy explains how [Legal Entity Name] ('KainGo', 'we', 'us') collects, uses, discloses, and protects personal information when you use the Platform. We are committed to complying with the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and the issuances of the National Privacy Commission (NPC).",
          },
        ],
      },
      {
        id: "scope",
        heading: "2. Scope",
        blocks: [
          {
            t: "p",
            text: "This Policy applies to personal information we collect through the KainGo website and applications, including when you create an account, browse, place orders, or register as a Restaurant Partner.",
          },
        ],
      },
      {
        id: "collect",
        heading: "3. Information We Collect",
        blocks: [
          {
            t: "ul",
            items: [
              "Account information: full name, email address, phone number, password (stored in hashed form), profile picture, and, where provided, address, city, and postal code.",
              "Affiliation details where provided during registration (such as department, course, or year).",
              "Order and transaction information: items ordered, amounts, delivery address and city, special instructions, payment method and status, and order timestamps.",
              "Content you provide: reviews, ratings, favorites, and messages or instructions.",
              "Restaurant Partner information: business name and address, province, city, postal code, business permit number and supporting document, owner name and phone, business email, username, logo, and menu content.",
              "Technical and usage information: device and browser type, IP address, general location derived from IP, pages viewed, and Platform interactions.",
              "Cookies and local storage identifiers (see our Cookie Policy).",
            ],
          },
        ],
      },
      {
        id: "use",
        heading: "4. How We Use Information",
        blocks: [
          {
            t: "ul",
            items: [
              "Create and manage accounts and authenticate users.",
              "Process, fulfill, and support orders, and communicate about them.",
              "Connect Customers with Restaurant Partners and enable fulfillment.",
              "Provide customer support and respond to inquiries.",
              "Maintain safety, prevent fraud and abuse, and enforce our policies.",
              "Improve and personalize the Platform, including features such as favorites and recommendations.",
              "Comply with legal, tax, and regulatory obligations.",
              "Send service and, where permitted, promotional messages. You may opt out of marketing messages.",
            ],
          },
        ],
      },
      {
        id: "legal-basis",
        heading: "5. Legal Bases for Processing",
        blocks: [
          {
            t: "p",
            text: "Under the Data Privacy Act, we process personal information based on one or more of the following:",
          },
          {
            t: "ul",
            items: [
              "Your consent (for example, marketing communications and non-essential cookies).",
              "Performance of a contract (to provide the Platform and fulfill orders).",
              "Our legitimate interests (such as security, fraud prevention, and service improvement), balanced against your rights.",
              "Compliance with legal obligations.",
              "Protection of your vital interests or those of another person, where applicable.",
            ],
          },
        ],
      },
      {
        id: "share",
        heading: "6. How We Share Information",
        blocks: [
          {
            t: "ul",
            items: [
              "With Restaurant Partners: to the extent needed to prepare and fulfill your order (for example, order contents and delivery details).",
              "With service providers: hosting, storage, communications, and similar vendors that process data on our behalf under confidentiality obligations.",
              "With payment or fulfillment providers, where such services are used.",
              "For legal reasons: to comply with law, respond to lawful requests, or protect rights and safety.",
              "In a business transfer: in connection with a merger, acquisition, or sale of assets, subject to this Policy.",
            ],
          },
          { t: "p", text: "We do not sell your personal information." },
        ],
      },
      {
        id: "cookies",
        heading: "7. Cookies and Tracking Technologies",
        blocks: [
          {
            t: "p",
            text: "We use cookies and browser local storage to operate the Platform (for example, to keep you signed in). For details and how to manage them, see our Cookie Policy.",
          },
        ],
      },
      {
        id: "retention",
        heading: "8. Data Retention",
        blocks: [
          {
            t: "p",
            text: "We retain personal information for as long as necessary to provide the Platform, comply with legal, tax, and accounting requirements, resolve disputes, and enforce agreements. When it is no longer needed, we delete, anonymize, or securely dispose of it in accordance with applicable law.",
          },
        ],
      },
      {
        id: "security",
        heading: "9. Data Security",
        blocks: [
          {
            t: "p",
            text: "We implement reasonable organizational, physical, and technical safeguards designed to protect personal information against unauthorized access, alteration, disclosure, or destruction. These include password hashing, access controls, and secure transmission where applicable. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
          },
        ],
      },
      {
        id: "rights",
        heading: "10. Your Rights",
        blocks: [
          {
            t: "p",
            text: "Subject to the Data Privacy Act, you have the right to:",
          },
          {
            t: "ul",
            items: [
              "Be informed about how your data is processed.",
              "Object to processing, including for direct marketing.",
              "Access your personal information.",
              "Correct inaccurate or outdated information.",
              "Erase or block your personal information, subject to legal retention requirements.",
              "Data portability, where applicable.",
              "File a complaint with the National Privacy Commission.",
              "Be indemnified for damages sustained due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of your data.",
            ],
          },
          {
            t: "p",
            text: "To exercise your rights, contact our Data Protection Officer at [Privacy/DPO Email]. We will respond within the periods required by law.",
          },
        ],
      },
      {
        id: "children",
        heading: "11. Children's Privacy",
        blocks: [
          {
            t: "p",
            text: "The Platform is not directed to children below the age required to consent under applicable law. We do not knowingly collect personal information from children without appropriate consent. If you believe a child has provided us information, please contact us so we can remove it.",
          },
        ],
      },
      {
        id: "transfers",
        heading: "12. International Data Transfers",
        blocks: [
          {
            t: "p",
            text: "We may process or store information in locations outside the Philippines. Where we transfer personal information across borders, we take steps to ensure an adequate level of protection consistent with the Data Privacy Act.",
          },
        ],
      },
      {
        id: "changes",
        heading: "13. Changes to This Policy",
        blocks: [
          {
            t: "p",
            text: "We may update this Privacy Policy from time to time. Material changes will be posted on the Platform with a new effective date. Continued use of the Platform after changes take effect indicates acceptance of the updated Policy.",
          },
        ],
      },
      {
        id: "contact",
        heading: "14. Contact Us",
        blocks: [
          {
            t: "p",
            text: "Data Protection Officer: [Legal Entity Name], [Business Address]. Email: [Privacy/DPO Email].",
          },
          {
            t: "p",
            text: "You may also contact the National Privacy Commission (www.privacy.gov.ph) regarding any concerns about how we handle your personal information.",
          },
        ],
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    short: "Cookie Policy",
    summary:
      "How KainGo uses cookies and browser local storage, and how you can manage them.",
    effective: "[Effective Date]",
    updated: "[Last Updated Date]",
    sections: [
      {
        id: "what",
        heading: "1. What Are Cookies?",
        blocks: [
          {
            t: "p",
            text: "Cookies are small text files stored on your device when you visit a website. They help the Platform function, remember your preferences, and improve your experience. We also use similar technologies, such as browser local storage.",
          },
        ],
      },
      {
        id: "how",
        heading: "2. How We Use Cookies and Local Storage",
        blocks: [
          {
            t: "ul",
            items: [
              "Keep you signed in and maintain your session.",
              "Remember preferences and settings, such as your theme (light or dark).",
              "Support core features such as your cart and favorites.",
              "Maintain the security and integrity of the Platform.",
              "Measure and improve performance, where analytics are enabled.",
            ],
          },
        ],
      },
      {
        id: "types",
        heading: "3. Types of Cookies We Use",
        blocks: [
          {
            t: "p",
            text: "Strictly necessary. These are required for the Platform to function and cannot be switched off. They include a session cookie that keeps you authenticated and local storage values such as your authentication token.",
          },
          {
            t: "p",
            text: "Functionality. These remember the choices you make, such as your theme and display preferences.",
          },
          {
            t: "p",
            text: "Analytics and performance (optional). Where enabled, these help us understand how the Platform is used so we can improve it. We will seek consent where required.",
          },
        ],
      },
      {
        id: "third-party",
        heading: "4. Third-Party Cookies",
        blocks: [
          {
            t: "p",
            text: "Some features may rely on third-party providers (for example, hosting, fonts, or mapping) that may set their own cookies. These are governed by the respective providers' policies.",
          },
        ],
      },
      {
        id: "manage",
        heading: "5. Managing Cookies",
        blocks: [
          {
            t: "p",
            text: "You can control or delete cookies through your browser settings and can block future cookies. If you disable strictly necessary cookies or clear local storage, you may be signed out and some features may not work.",
          },
        ],
      },
      {
        id: "local-storage",
        heading: "6. Local Storage",
        blocks: [
          {
            t: "p",
            text: "We store certain information in your browser's local storage (for example, your sign-in token and theme preference). Clearing your browser data will remove these, and you may need to sign in again.",
          },
        ],
      },
      {
        id: "changes",
        heading: "7. Changes",
        blocks: [
          {
            t: "p",
            text: "We may update this Cookie Policy from time to time. Changes will be posted with a new effective date.",
          },
        ],
      },
      {
        id: "contact",
        heading: "8. Contact",
        blocks: [
          {
            t: "p",
            text: "Questions about this Cookie Policy may be sent to [Legal Entity Name] at [Support Email].",
          },
        ],
      },
    ],
  },

  refunds: {
    slug: "refunds",
    title: "Refund & Cancellation Policy",
    short: "Refund & Cancellation Policy",
    summary:
      "When you can cancel an order and when you may be eligible for a refund.",
    effective: "[Effective Date]",
    updated: "[Last Updated Date]",
    sections: [
      {
        id: "overview",
        heading: "1. Overview",
        blocks: [
          {
            t: "p",
            text: "This Refund & Cancellation Policy explains when you can cancel an order and when you may be eligible for a refund. It forms part of our Terms of Service.",
          },
        ],
      },
      {
        id: "cancel",
        heading: "2. Cancelling an Order",
        blocks: [
          {
            t: "ul",
            items: [
              "You may request to cancel an order before the Restaurant Partner accepts or begins preparing it. If the order has not been accepted, cancellation is generally free.",
              "Once a Partner has accepted or started preparing an order, cancellation may not be possible because food may already be prepared.",
              "To request a cancellation, use the Platform where available or contact support at [Support Email] as soon as possible.",
            ],
          },
        ],
      },
      {
        id: "by-partner",
        heading: "3. Cancellation by the Partner or KainGo",
        blocks: [
          {
            t: "p",
            text: "A Partner or KainGo may cancel an order if items are unavailable, if there is a pricing or listing error, if the delivery address is outside the service area, or in other reasonable circumstances. If we cancel an accepted order that you have already paid for, you will receive a refund for the cancelled amount in accordance with this Policy.",
          },
        ],
      },
      {
        id: "eligible",
        heading: "4. When You May Be Eligible for a Refund",
        blocks: [
          {
            t: "ul",
            items: [
              "Your order was not fulfilled or not delivered.",
              "You received incorrect, incomplete, or missing items.",
              "The order was materially different from what was described.",
              "You were charged incorrectly or more than once.",
            ],
          },
          {
            t: "p",
            text: "Refund eligibility for quality or missing-item issues may require reasonable evidence (for example, a photo) and is subject to review.",
          },
        ],
      },
      {
        id: "not-eligible",
        heading: "5. When Refunds Do Not Apply",
        blocks: [
          {
            t: "ul",
            items: [
              "Change of mind after a Partner has accepted or prepared the order.",
              "An incorrect address or unavailability of the recipient provided by you.",
              "Orders that were correctly fulfilled and delivered as described.",
              "Complaints raised after an unreasonable delay following fulfillment.",
            ],
          },
        ],
      },
      {
        id: "request",
        heading: "6. How to Request a Refund",
        blocks: [
          {
            t: "p",
            text: "Contact [Support Email] or [Contact Number] with your order number, the affected items, and a description of the issue (with photos where relevant). Please raise issues as soon as reasonably possible after the order.",
          },
        ],
      },
      {
        id: "method",
        heading: "7. Refund Methods and Timing",
        blocks: [
          {
            t: "p",
            text: "Approved refunds are issued through the original payment method where possible or as otherwise agreed. Processing time depends on your payment provider and may take several business days. Where payment was made directly to a Partner, refunds may be arranged with that Partner.",
          },
        ],
      },
      {
        id: "chargebacks",
        heading: "8. Chargebacks and Disputes",
        blocks: [
          {
            t: "p",
            text: "If you have an issue, please contact us first so we can help resolve it. Filing a chargeback does not replace this process, and we may provide relevant records to your payment provider.",
          },
        ],
      },
      {
        id: "changes",
        heading: "9. Changes",
        blocks: [
          {
            t: "p",
            text: "We may update this Policy from time to time. Changes will be posted with a new effective date.",
          },
        ],
      },
      {
        id: "contact",
        heading: "10. Contact",
        blocks: [
          {
            t: "p",
            text: "[Legal Entity Name], Email: [Support Email], Phone: [Contact Number].",
          },
        ],
      },
    ],
  },

  "acceptable-use": {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    short: "Acceptable Use Policy",
    summary: "What is and is not allowed when using the KainGo Platform.",
    effective: "[Effective Date]",
    updated: "[Last Updated Date]",
    sections: [
      {
        id: "purpose",
        heading: "1. Purpose",
        blocks: [
          {
            t: "p",
            text: "This Acceptable Use Policy ('AUP') sets out what is and is not allowed on the KainGo Platform. It applies to all users, including Customers and Restaurant Partners, and forms part of our Terms of Service.",
          },
        ],
      },
      {
        id: "prohibited",
        heading: "2. Prohibited Conduct",
        blocks: [
          {
            t: "ul",
            items: [
              "Violating any applicable law or regulation.",
              "Placing fraudulent, abusive, or deliberately fake orders.",
              "Harassing, threatening, or defaming others, including restaurant staff and delivery personnel.",
              "Impersonating any person or entity, or misrepresenting your affiliation.",
              "Attempting to gain unauthorized access to accounts, systems, or data.",
              "Scraping, harvesting, or bulk-collecting data or other users' information.",
              "Reverse engineering, decompiling, or interfering with the Platform's operation or security.",
              "Introducing malware or any code designed to disrupt or damage the Platform.",
              "Posting false, misleading, or manipulated reviews and ratings.",
              "Using the Platform to send spam or unauthorized advertising.",
              "Infringing the intellectual property or privacy rights of others.",
            ],
          },
        ],
      },
      {
        id: "partners",
        heading: "3. Menu and Content Standards (Restaurant Partners)",
        blocks: [
          {
            t: "ul",
            items: [
              "Provide accurate, lawful, and up-to-date menu items, descriptions, prices, and images.",
              "Comply with all applicable food safety, sanitation, licensing, and labeling requirements.",
              "Do not upload content that is unlawful, misleading, or infringes third-party rights.",
              "Maintain the permits and documents required to operate your business.",
            ],
          },
        ],
      },
      {
        id: "reviews",
        heading: "4. Reviews and User Content",
        blocks: [
          {
            t: "p",
            text: "Reviews and other user content must be honest and based on genuine experiences. You are responsible for the content you post and must have the right to post it. We may remove content that violates this AUP or applicable law.",
          },
        ],
      },
      {
        id: "reporting",
        heading: "5. Reporting Violations",
        blocks: [
          {
            t: "p",
            text: "To report a violation or abuse, contact [Support Email]. Please include relevant details so we can investigate.",
          },
        ],
      },
      {
        id: "enforcement",
        heading: "6. Enforcement",
        blocks: [
          {
            t: "p",
            text: "We may investigate suspected violations and take action we deem appropriate, including removing content, issuing a warning, suspending or terminating accounts, restricting access, and reporting to the relevant authorities. We may cooperate with law enforcement.",
          },
        ],
      },
      {
        id: "changes",
        heading: "7. Changes",
        blocks: [
          {
            t: "p",
            text: "We may update this AUP from time to time. Changes will be posted with a new effective date.",
          },
        ],
      },
      {
        id: "contact",
        heading: "8. Contact",
        blocks: [
          {
            t: "p",
            text: "[Legal Entity Name], Email: [Support Email].",
          },
        ],
      },
    ],
  },

  "partner-agreement": {
    slug: "partner-agreement",
    title: "Restaurant Partner Agreement",
    short: "Partner Agreement",
    summary:
      "The terms that govern restaurants and food businesses that offer items on KainGo.",
    effective: "[Effective Date]",
    updated: "[Last Updated Date]",
    sections: [
      {
        id: "introduction",
        heading: "1. Introduction",
        blocks: [
          {
            t: "p",
            text: "This Restaurant Partner Agreement ('Agreement') governs the relationship between [Legal Entity Name] ('KainGo') and a restaurant or food business ('Partner', 'you') that registers to offer items through the KainGo Platform. By registering as a Partner, you agree to this Agreement, our Terms of Service, and our applicable policies.",
          },
        ],
      },
      {
        id: "eligibility",
        heading: "2. Eligibility and Onboarding",
        blocks: [
          {
            t: "ul",
            items: [
              "You must be a legally operating food business with the required permits and licenses.",
              "You must provide accurate business information, including business name and address, owner details, business email, and a valid business permit number and supporting document.",
              "Registration is subject to review and verification. We may approve, reject, or request additional information.",
            ],
          },
        ],
      },
      {
        id: "responsibilities",
        heading: "3. Partner Responsibilities",
        blocks: [
          {
            t: "ul",
            items: [
              "Keep menu items, descriptions, prices, images, availability, and stock accurate and current.",
              "Prepare and fulfill accepted orders in a timely and professional manner.",
              "Comply with all food safety, sanitation, and labeling laws and standards.",
              "Maintain the licenses and permits necessary for your operations.",
              "Provide customer service for issues relating to your food and fulfillment.",
              "Not misrepresent your products or engage in conduct prohibited by our Acceptable Use Policy.",
            ],
          },
        ],
      },
      {
        id: "fees",
        heading: "4. Fees and Commission",
        blocks: [
          {
            t: "p",
            text: "In consideration for use of the Platform, KainGo may charge a commission, subscription, or other fees as communicated to you. Applicable rates, and any changes to them, will be provided to you. [Fee/Commission Terms — to be specified.]",
          },
        ],
      },
      {
        id: "orders",
        heading: "5. Orders and Fulfillment",
        blocks: [
          {
            t: "ul",
            items: [
              "You are responsible for accepting, preparing, and, where offered, handing off orders for fulfillment.",
              "Estimated preparation and fulfillment times should be reasonable and honored to the extent possible.",
              "You must promptly notify KainGo or the Customer if an item becomes unavailable.",
            ],
          },
        ],
      },
      {
        id: "payouts",
        heading: "6. Payments and Payouts",
        blocks: [
          {
            t: "p",
            text: "Where KainGo collects payments on your behalf, settlement to you will be made according to the agreed schedule and method, net of applicable fees, chargebacks, and adjustments. [Payout/Settlement Terms — to be specified.] Where Customers pay you directly, you are responsible for collecting and remitting applicable taxes.",
          },
        ],
      },
      {
        id: "food-safety",
        heading: "7. Food Safety and Compliance",
        blocks: [
          {
            t: "p",
            text: "You are solely responsible for the safety, quality, legality, and accurate description of the food and beverages you offer. You must comply with all applicable food safety and consumer protection laws.",
          },
        ],
      },
      {
        id: "ip",
        heading: "8. Intellectual Property and Content License",
        blocks: [
          {
            t: "p",
            text: "You retain ownership of your trademarks, logos, and menu content. You grant KainGo a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute your name, logo, and menu content on the Platform and in related marketing, for the purpose of operating and promoting the Platform.",
          },
        ],
      },
      {
        id: "ratings",
        heading: "9. Ratings, Reviews, and Suspension",
        blocks: [
          {
            t: "p",
            text: "Customers may rate and review their experiences. Poor performance, repeated cancellations, policy violations, or complaints may result in review, corrective action, suspension, or removal from the Platform.",
          },
        ],
      },
      {
        id: "termination",
        heading: "10. Termination",
        blocks: [
          {
            t: "p",
            text: "Either party may terminate this Agreement in accordance with the Platform's process or on reasonable notice. We may suspend or terminate immediately for material breach, illegal activity, or risk to users. Upon termination, you must fulfill accepted orders unless otherwise agreed.",
          },
        ],
      },
      {
        id: "liability",
        heading: "11. Liability and Indemnity",
        blocks: [
          {
            t: "p",
            text: "You agree to indemnify and hold harmless KainGo from claims arising from your products, operations, breach of this Agreement, or violation of law. KainGo's liability is limited to the maximum extent permitted by law, consistent with our Terms of Service.",
          },
        ],
      },
      {
        id: "governing-law",
        heading: "12. Governing Law",
        blocks: [
          {
            t: "p",
            text: "This Agreement is governed by the laws of the Republic of the Philippines. Disputes will be subject to the exclusive jurisdiction of the courts of [City], Philippines, subject to prior good-faith efforts to resolve them amicably.",
          },
        ],
      },
      {
        id: "contact",
        heading: "13. Contact",
        blocks: [
          {
            t: "p",
            text: "Partner support: [Support Email]. [Legal Entity Name], [Business Address].",
          },
        ],
      },
    ],
  },
};
