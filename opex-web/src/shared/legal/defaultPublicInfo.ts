import type { LegalPublicInfoRecord } from '../types/legal';

const LEGAL_VERSION = '2026-04-09';

export const DEFAULT_LEGAL_PUBLIC_INFO: LegalPublicInfoRecord = {
  controller: {
    name: 'Opex',
    address: 'Configure the legal entity and registered office before production go-live.',
    privacyEmail: 'privacy@opex.local',
    dpoEmail: 'dpo@opex.local',
    supportEmail: 'support@opex.local',
    supervisoryAuthority: 'Configure the competent supervisory authority before go-live.'
  },
  processors: [
    {
      name: 'Keycloak',
      purpose: 'Authentication, identity and session management',
      dataCategories: 'Email address, names, account identifiers and authentication metadata',
      region: 'Configured by your deployment'
    },
    {
      name: 'Salt Edge',
      purpose: 'Open-banking connectivity and bank authorization redirect flows',
      dataCategories: 'Customer identifiers, connection metadata, balances and transactions for connected accounts',
      region: 'Configured by your Salt Edge account'
    }
  ],
  storageTechnologies: [
    {
      name: 'Access token',
      key: 'opex_access_token',
      purpose: 'Maintains the authenticated browser session',
      duration: 'Until logout or token expiry',
      essential: true
    },
    {
      name: 'Refresh token',
      key: 'opex_refresh_token',
      purpose: 'Renews the authenticated session without forcing a new login',
      duration: 'Until logout or refresh expiry',
      essential: true
    },
    {
      name: 'Token expiry marker',
      key: 'opex_token_expires_at',
      purpose: 'Tracks when the current token must be refreshed',
      duration: 'Until logout or token expiry',
      essential: true
    },
    {
      name: 'PKCE verifier',
      key: 'opex_pkce_verifier',
      purpose: 'Secures the OAuth login flow',
      duration: 'Session storage, removed after login',
      essential: true
    },
    {
      name: 'OAuth state',
      key: 'opex_oauth_state',
      purpose: 'Protects the login flow against CSRF and state mismatch',
      duration: 'Session storage, removed after login',
      essential: true
    },
    {
      name: 'Selected provider',
      key: 'opex_selected_provider_name',
      purpose: 'Remembers the selected provider filter in the UI',
      duration: 'Until changed or storage is cleared',
      essential: true
    },
    {
      name: 'Provider cache',
      key: 'opex_bank_providers',
      purpose: 'Caches provider names for the active browser workspace',
      duration: 'Until refreshed or storage is cleared',
      essential: true
    },
    {
      name: 'Bank sync marker',
      key: 'opex_bank_sync_completed_at',
      purpose: 'Signals that another tab should refresh after a completed bank sync',
      duration: 'Until overwritten or storage is cleared',
      essential: true
    }
  ],
  privacyPolicy: {
    slug: 'privacy',
    title: 'Privacy Notice',
    version: LEGAL_VERSION,
    lastUpdated: LEGAL_VERSION,
    summary: 'How Opex collects, uses, stores and shares account, budgeting and optional open-banking data.',
    sections: [
      {
        title: 'Data We Process',
        bullets: [
          'Identity and account data such as email address, first name, last name and profile settings.',
          'Tax profile, residency and budgeting data that you actively enter in the app.',
          'Optional banking data imported after a dedicated open-banking confirmation, including connection metadata, balances and transactions.',
          'Technical and security data necessary to authenticate users, keep sessions active and protect the service.'
        ]
      },
      {
        title: 'Purposes And Legal Bases',
        bullets: [
          'Account and workspace data are processed to provide the Opex service under Article 6(1)(b) GDPR.',
          'Optional open-banking data are processed only after a dedicated confirmation for the bank-connection feature and its continuity.',
          'Financial and tax-related records may be retained where a legal obligation applies under Article 6(1)(c) GDPR.',
          'Limited technical and security data may be processed under Article 6(1)(f) GDPR to maintain service integrity, prevent abuse and troubleshoot incidents.'
        ]
      },
      {
        title: 'Recipients And Processors',
        bullets: [
          'Keycloak handles authentication and identity flows.',
          'Salt Edge handles open-banking connection and authorization redirects where you choose to connect a bank.',
          'Configured infrastructure providers may process runtime and security metadata where those features are enabled.'
        ]
      },
      {
        title: 'Retention',
        bullets: [
          'Active account data should be retained only while the account remains active and for a short closure period unless a statutory retention rule applies.',
          'Closed-account financial and tax records may need longer retention under local accounting or tax rules.',
          'Open-banking data should be deleted or anonymized when the related connection is no longer needed, subject to legal retention duties.',
          'Consent audit data should be retained long enough to demonstrate when current legal versions were accepted.'
        ]
      },
      {
        title: 'Your Rights',
        bullets: [
          'You can request access, rectification, erasure, restriction, portability and objection where GDPR conditions apply.',
          'You can export the data currently available in your account from the privacy area.',
          'You can close the account from the app and contact the configured privacy email for privacy requests.',
          'You can lodge a complaint with the competent supervisory authority for your jurisdiction.'
        ]
      }
    ]
  },
  termsOfService: {
    slug: 'terms',
    title: 'Terms of Service',
    version: LEGAL_VERSION,
    lastUpdated: LEGAL_VERSION,
    summary: 'Core contractual rules for using Opex, including user responsibilities and optional integrations.',
    sections: [
      {
        title: 'Using Opex',
        bullets: [
          'You must provide accurate account information and keep login credentials confidential.',
          'You may use Opex for budgeting, tax-planning support and optional open-banking synchronization.',
          'You must not use the service in ways that violate law, third-party rights or platform security.'
        ]
      },
      {
        title: 'Third-Party Services',
        bullets: [
          'Authentication is provided through Keycloak-based identity flows.',
          'Open-banking connectivity is facilitated through Salt Edge and depends on the rules of your bank and the applicable open-finance regime.',
          'External infrastructure providers may support runtime, security and hosting operations where needed.'
        ]
      },
      {
        title: 'No Professional Advice',
        bullets: [
          'Budgeting, reminders and tax estimates in Opex are operational support tools only.',
          'Nothing in Opex replaces legal, accounting, tax or investment advice from a qualified professional.'
        ]
      },
      {
        title: 'Termination And Changes',
        bullets: [
          'You can stop using the service and export your available data at any time.',
          'Opex may suspend or close accounts for security, legal or abuse-prevention reasons.',
          'Material updates to these terms may require a renewed acceptance before continued use.'
        ]
      }
    ]
  },
  cookiePolicy: {
    slug: 'cookies',
    title: 'Cookie And Storage Notice',
    version: LEGAL_VERSION,
    lastUpdated: LEGAL_VERSION,
    summary: 'A notice covering the essential browser storage currently used by Opex.',
    sections: [
      {
        title: 'Strictly Necessary Storage',
        bullets: [
          'The current Opex web application stores only authentication and feature-continuity data that are necessary for secure login and core product flows.',
          'The current codebase does not include marketing or analytics cookies.'
        ]
      },
      {
        title: 'Storage Keys Used By The App',
        bullets: [
          'Authentication tokens keep the login session active.',
          'PKCE verifier and OAuth state protect the login flow.',
          'Provider selection and sync markers preserve continuity between views and browser tabs.'
        ]
      },
      {
        title: 'Managing Storage',
        bullets: [
          'Authentication storage is cleared on logout.',
          'Browser controls can remove local or session storage, but doing so may interrupt login or selected-provider continuity.'
        ]
      }
    ]
  },
  openBankingNotice: {
    slug: 'open-banking',
    title: 'Open Banking Data Notice',
    version: LEGAL_VERSION,
    lastUpdated: LEGAL_VERSION,
    summary: 'A specific disclosure shown before Opex redirects a user to Salt Edge to connect a bank.',
    sections: [
      {
        title: 'What Happens When You Connect A Bank',
        bullets: [
          'Opex shares the minimum identifiers needed to create and maintain your banking connection through Salt Edge.',
          'After you authorize with your bank, Opex may import connection metadata, account information, balances and transactions into your workspace.'
        ]
      },
      {
        title: 'Why We Use The Data',
        bullets: [
          'Connected banking data power dashboards, account setup, budgeting views, transaction histories and tax-buffer calculations.',
          'Open-banking access is optional. You can continue using manual accounts without granting this access.'
        ]
      },
      {
        title: 'Consent Renewal',
        bullets: [
          'Bank access approvals can expire under the rules of your bank or open-banking provider, so the app may ask you to renew consent periodically.',
          'Do not connect an account unless you are authorized to grant access to the underlying banking data.'
        ]
      }
    ]
  }
};
