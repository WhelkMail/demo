import type {
  Account,
  AppSettings,
  Contact,
  HealthStatus,
  Label,
  MailFilter,
  MessageDetail,
  MessageSummary,
  StorageOptions,
  UpdateStatus,
} from '../../shared/types'

const NOW = Date.now()
const hoursAgo = (hours: number): string => new Date(NOW - hours * 3_600_000).toISOString()
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

export const accounts: Account[] = [
  {
    id: 'acc-imap',
    email: 'mario@example.com',
    displayName: 'Mario Rossi',
    kind: 'imap',
    imapHost: 'imap.example.com',
    imapPort: 993,
    imapSecurity: 'tls',
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    smtpSecurity: 'tls',
    username: 'mario@example.com',
    authType: 'password',
    oauthProvider: null,
    connected: true,
    signature: 'Mario Rossi\n+1 555 0100',
    incomingLabelId: null,
    archiveImapBodies: false,
    imapArchiveDriver: 'r2',
    deleteAfterArchive: false,
    autoSync: true,
    syncIntervalMinutes: 5,
    sentFolder: 'Sent',
    autoSavesSent: true,
    sentCopyAccountId: null,
    replyAccountId: null,
    relayAnyAddress: false,
    maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
    storageDriver: 'provider',
    relayProvider: null,
    relayConfigured: false,
    driveConnected: false,
    r2Available: false,
    createdAt: '2025-01-10T09:00:00.000Z',
  },
  {
    id: 'acc-relay',
    email: 'hello@atelier.example',
    displayName: 'Atelier',
    kind: 'relay',
    imapHost: null,
    imapPort: null,
    imapSecurity: null,
    smtpHost: null,
    smtpPort: null,
    smtpSecurity: null,
    username: 'hello@atelier.example',
    authType: 'password',
    oauthProvider: null,
    connected: true,
    signature: 'Atelier — hello@atelier.example',
    incomingLabelId: null,
    archiveImapBodies: false,
    imapArchiveDriver: 'r2',
    deleteAfterArchive: false,
    autoSync: false,
    syncIntervalMinutes: 5,
    sentFolder: 'Sent',
    autoSavesSent: true,
    sentCopyAccountId: null,
    replyAccountId: null,
    relayAnyAddress: true,
    maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
    storageDriver: 'r2',
    relayProvider: 'smtp2go',
    relayConfigured: true,
    driveConnected: false,
    r2Available: true,
    createdAt: '2025-03-02T11:30:00.000Z',
  },
]

export const labels: Label[] = [
  { id: 'l-work', name: 'Work', color: 'blue', createdAt: '2025-01-10T09:10:00.000Z' },
  { id: 'l-projects', name: 'Projects', color: 'emerald', createdAt: '2025-01-10T09:11:00.000Z' },
  { id: 'l-read', name: 'To read', color: 'amber', createdAt: '2025-01-10T09:12:00.000Z' },
  { id: 'l-invoices', name: 'Invoices', color: 'rose', createdAt: '2025-01-10T09:13:00.000Z' },
]

export const contacts: Contact[] = [
  { id: 'c-1', name: 'Luca Bianchi', email: 'luca.bianchi@example.org', note: 'Customer', createdAt: '2025-02-01T10:00:00.000Z' },
  { id: 'c-2', name: 'Sara Conti', email: 'sara.conti@example.org', note: 'Design', createdAt: '2025-02-02T10:00:00.000Z' },
  { id: 'c-3', name: 'Giulia Verdi', email: 'giulia.verdi@example.net', note: '', createdAt: '2025-02-03T10:00:00.000Z' },
  { id: 'c-4', name: 'Billing Studio', email: 'billing@example.org', note: 'Accounting', createdAt: '2025-02-04T10:00:00.000Z' },
  { id: 'c-5', name: 'Demo Customer', email: 'cliente@example.org', note: '', createdAt: '2025-02-05T10:00:00.000Z' },
]

export const filters: MailFilter[] = [
  {
    id: 'f-1',
    accountId: '',
    autoLabel: false,
    name: 'Invoices',
    from: 'billing@example.org',
    to: null,
    subject: null,
    hasWords: null,
    doesntHave: null,
    hasAttachment: false,
    labelIds: ['l-invoices'],
    forwardTo: [],
    enabled: true,
    createdAt: '2025-02-10T10:00:00.000Z',
    lastForwardStatus: null,
    lastForwardError: null,
    lastForwardAt: null,
  },
  {
    id: 'f-2',
    accountId: 'acc-imap',
    autoLabel: true,
    name: 'Work',
    from: null,
    to: null,
    subject: null,
    hasWords: null,
    doesntHave: null,
    hasAttachment: false,
    labelIds: ['l-work'],
    forwardTo: [],
    enabled: true,
    createdAt: '2025-02-11T10:00:00.000Z',
    lastForwardStatus: null,
    lastForwardError: null,
    lastForwardAt: null,
  },
]

export const settings: AppSettings = {
  defaultSignature: 'Mario Rossi\n+1 555 0100',
  signatureMode: 'shared',
  allowRemoteImages: false,
  metadataRetentionDays: 90,
}

export const health: HealthStatus = {
  ok: true,
  version: '1.2.0',
  driveConfigured: false,
  r2Configured: true,
  relayConfigured: true,
  relayProvider: 'smtp2go',
  relayLabel: 'SMTP2GO',
  maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
  microsoftConfigured: false,
  googleMailConfigured: false,
  pushConfigured: false,
  cronConfigured: false,
}

export const storageOptions: StorageOptions = { drive: false, r2: true }

export const updateStatus: UpdateStatus = {
  installed: '1.2.0',
  latest: '1.2.0',
  releaseName: null,
  releaseUrl: null,
  publishedAt: null,
  updateAvailable: false,
  dismissed: false,
  checkEnabled: false,
  error: null,
}

export interface MessageSeed extends Partial<MessageDetail> {
  id: string
  folder: MessageDetail['folder']
  from: MessageDetail['from']
  subject: string
  date: string
  text: string
}

export function makeMessage(account: Account, seed: MessageSeed): MessageDetail {
  const attachments = seed.attachments ?? []
  return {
    id: seed.id,
    accountId: account.id,
    accountEmail: account.email,
    accountName: account.displayName,
    folder: seed.folder,
    from: seed.from,
    to: seed.to ?? [{ name: account.displayName, email: account.email }],
    cc: seed.cc ?? [],
    bcc: seed.bcc ?? [],
    subject: seed.subject,
    snippet: seed.snippet ?? seed.text.replace(/\s+/g, ' ').slice(0, 140),
    date: seed.date,
    unread: seed.unread ?? false,
    hasAttachments: seed.hasAttachments ?? attachments.length > 0,
    status: seed.status ?? 'sent',
    labelIds: seed.labelIds ?? [],
    threadKey: seed.threadKey ?? seed.id,
    threadCount: seed.threadCount,
    threadUnread: seed.threadUnread,
    threadParticipants: seed.threadParticipants,
    aliasAddresses: seed.aliasAddresses ?? [],
    verifiedDomains: seed.verifiedDomains ?? [],
    messageId: seed.messageId ?? `<${seed.id}@demo.example>`,
    references: seed.references ?? null,
    text: seed.text,
    html: seed.html ?? null,
    attachments,
    size: seed.size ?? seed.text.length,
  }
}

const imap = accounts[0]
const relay = accounts[1]

export const seedMessages: MessageDetail[] = [
  makeMessage(imap, {
    id: 'm-contract-2',
    folder: 'inbox',
    threadKey: 't-contract',
    from: { name: 'Luca Bianchi', email: 'luca.bianchi@example.org' },
    to: [{ name: 'Mario Rossi', email: 'mario@example.com' }],
    subject: 'Annual contract renewal',
    date: hoursAgo(74),
    text:
      'Hi Mario,\n\njust confirming that the contract expires on November 30. Can we review it together next week?\n\nLuca',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-contract-1',
    folder: 'inbox',
    threadKey: 't-contract',
    from: { name: 'Sara Conti', email: 'sara.conti@example.org' },
    to: [{ name: 'Mario Rossi', email: 'mario@example.com' }],
    cc: [{ name: 'Luca Bianchi', email: 'luca.bianchi@example.org' }],
    subject: 'Re: Annual contract renewal',
    date: hoursAgo(2),
    unread: true,
    text:
      'Perfect, I added the changes to point 3 and attached the updated version.\n\nLet me know if that works for you.\n\nSara',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-welcome',
    folder: 'inbox',
    threadKey: 't-welcome',
    from: { name: 'WhelkMail', email: 'hello@example.com' },
    subject: 'Welcome to WhelkMail',
    date: hoursAgo(5),
    unread: true,
    text:
      'This is a static demo: the messages are fake and no data is sent to a server. Explore the inbox, the reading pane, labels, search and compose.',
    labelIds: ['l-read'],
    html:
      '<div style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.6">' +
      '<h1 style="margin:0 0 12px;font-size:22px">Welcome to WhelkMail</h1>' +
      '<p>This is a <strong>static demo</strong>: the messages are fake and no data is sent to a server.</p>' +
      '<p>Try the reading pane, labels, search and compose.</p>' +
      '<p style="color:#6b7280;font-size:12px">Remote images are blocked by default.</p>' +
      '<img src="https://tracker.example.com/pixel.png" width="1" height="1" alt="" style="display:block">' +
      '</div>',
  }),
  makeMessage(imap, {
    id: 'm-invoice',
    folder: 'inbox',
    threadKey: 't-invoice',
    from: { name: 'Billing Studio', email: 'billing@example.org' },
    subject: 'Invoice 2026-041',
    date: hoursAgo(9),
    text: 'Hello,\nplease find invoice 2026-041 attached.\n\nThanks,\nBilling Studio',
    labelIds: ['l-invoices'],
    attachments: [
      {
        index: 0,
        filename: 'invoice-2026-041.pdf',
        contentType: 'application/pdf',
        size: 48_123,
      },
    ],
  }),
  makeMessage(imap, {
    id: 'm-deploy',
    folder: 'inbox',
    threadKey: 't-deploy',
    from: { name: 'GitHub', email: 'notifications@example.com' },
    subject: 'Deploy completed',
    date: hoursAgo(20),
    text: 'The "deploy" workflow finished successfully on branch main.',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-lunch',
    folder: 'inbox',
    threadKey: 't-lunch',
    from: { name: 'Giulia Verdi', email: 'giulia.verdi@example.net' },
    subject: 'Lunch on Thursday?',
    date: hoursAgo(28),
    unread: true,
    text: 'Hi! Want to grab lunch on Thursday around 1pm? I know a nice place downtown.',
    labelIds: ['l-projects'],
  }),
  makeMessage(imap, {
    id: 'm-usage',
    folder: 'inbox',
    threadKey: 't-usage',
    from: { name: 'Cloudflare', email: 'billing@example.com' },
    subject: 'Monthly usage summary',
    date: hoursAgo(40),
    text: 'Your usage this month is within the plan limits. No action required.',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-design',
    folder: 'inbox',
    threadKey: 't-design',
    from: { name: 'Design Weekly', email: 'news@example.com' },
    subject: 'Top 10 UI trends for 2026',
    date: hoursAgo(52),
    text: 'A selection of the most interesting interface trends of the year.',
    labelIds: ['l-read'],
    html:
      '<div style="font-family:Georgia,serif;color:#111827;line-height:1.7">' +
      '<h2 style="font-family:Inter,Arial,sans-serif;margin:0 0 12px">Top 10 UI trends for 2026</h2>' +
      '<p>A selection of the most interesting interface trends of the year.</p>' +
      '<ul><li>Calm interfaces and generous typography</li><li>Dense but readable content</li><li>Subtle motion</li></ul>' +
      '<img src="https://tracker.example.com/open.gif" width="1" height="1" alt="">' +
      '</div>',
  }),
  makeMessage(imap, {
    id: 's-reply',
    folder: 'sent',
    threadKey: 't-sent-contract',
    from: { name: 'Mario Rossi', email: 'mario@example.com' },
    to: [{ name: 'Luca Bianchi', email: 'luca.bianchi@example.org' }],
    subject: 'Re: Annual contract renewal',
    date: hoursAgo(70),
    text: 'Hi Luca,\nsounds good, let\'s talk next week.\n\nMario',
    status: 'sent',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 's-invoice',
    folder: 'sent',
    threadKey: 't-sent-invoice',
    from: { name: 'Mario Rossi', email: 'mario@example.com' },
    to: [{ name: 'Demo Customer', email: 'cliente@example.org' }],
    subject: 'Invoice 2026-040',
    date: hoursAgo(96),
    text: 'Hello,\nplease find invoice 2026-040 attached.\n\nBest regards,\nMario Rossi',
    status: 'sent',
    labelIds: ['l-invoices'],
    attachments: [
      {
        index: 0,
        filename: 'invoice-2026-040.pdf',
        contentType: 'application/pdf',
        size: 52_004,
      },
    ],
  }),
  makeMessage(imap, {
    id: 'd-proposal',
    folder: 'draft',
    threadKey: 't-draft-proposal',
    from: { name: 'Mario Rossi', email: 'mario@example.com' },
    to: [{ name: 'Sara Conti', email: 'sara.conti@example.org' }],
    subject: 'Project proposal — draft',
    date: hoursAgo(1),
    text: 'Hi Sara,\nhere is a first draft of the proposal. The timeline section is still missing.',
    status: 'draft',
    labelIds: ['l-projects'],
  }),
  makeMessage(imap, {
    id: 'p-prize',
    folder: 'spam',
    threadKey: 't-spam',
    from: { name: 'Promo', email: 'promo@example.biz' },
    subject: 'You won a prize!',
    date: hoursAgo(30),
    unread: true,
    text: 'Click here to claim your prize. No real data is involved in this demo.',
  }),
  makeMessage(relay, {
    id: 'r-order',
    folder: 'inbox',
    threadKey: 't-order',
    from: { name: 'Demo Customer', email: 'cliente@example.org' },
    to: [{ name: 'Atelier', email: 'hello@atelier.example' }],
    subject: 'Order #1042',
    date: hoursAgo(4),
    unread: true,
    text:
      'Hello,\nI would like to confirm order #1042 and ask whether a note can be added to the invoice.\n\nThanks!',
    labelIds: ['l-work'],
  }),
  makeMessage(relay, {
    id: 'r-quote',
    folder: 'inbox',
    threadKey: 't-quote',
    from: { name: 'Print Supplier', email: 'fornitore@example.net' },
    to: [{ name: 'Atelier', email: 'hello@atelier.example' }],
    subject: 'Print quote',
    date: hoursAgo(22),
    text: 'Please find the quote for printing the catalogue attached. We remain at your disposal.',
  }),
]

export function summarize(message: MessageDetail): MessageSummary {
  return {
    id: message.id,
    accountId: message.accountId,
    accountEmail: message.accountEmail,
    accountName: message.accountName,
    folder: message.folder,
    from: message.from,
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    subject: message.subject,
    snippet: message.snippet,
    date: message.date,
    unread: message.unread,
    hasAttachments: message.hasAttachments,
    status: message.status,
    labelIds: message.labelIds,
    threadKey: message.threadKey,
    threadCount: message.threadCount,
    threadUnread: message.threadUnread,
    threadParticipants: message.threadParticipants,
  }
}
