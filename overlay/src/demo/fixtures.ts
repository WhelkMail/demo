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
    signature: 'Mario Rossi\n+39 000 000 0000',
    incomingLabelId: null,
    archiveImapBodies: false,
    imapArchiveDriver: 'r2',
    deleteAfterArchive: false,
    autoSync: true,
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
  { id: 'l-work', name: 'Lavoro', color: 'blue', createdAt: '2025-01-10T09:10:00.000Z' },
  { id: 'l-projects', name: 'Progetti', color: 'emerald', createdAt: '2025-01-10T09:11:00.000Z' },
  { id: 'l-read', name: 'Da leggere', color: 'amber', createdAt: '2025-01-10T09:12:00.000Z' },
  { id: 'l-invoices', name: 'Fatture', color: 'rose', createdAt: '2025-01-10T09:13:00.000Z' },
]

export const contacts: Contact[] = [
  { id: 'c-1', name: 'Luca Bianchi', email: 'luca.bianchi@example.org', note: 'Cliente', createdAt: '2025-02-01T10:00:00.000Z' },
  { id: 'c-2', name: 'Sara Conti', email: 'sara.conti@example.org', note: 'Design', createdAt: '2025-02-02T10:00:00.000Z' },
  { id: 'c-3', name: 'Giulia Verdi', email: 'giulia.verdi@example.net', note: '', createdAt: '2025-02-03T10:00:00.000Z' },
  { id: 'c-4', name: 'Fatture Studio', email: 'fatture@example.org', note: 'Amministrazione', createdAt: '2025-02-04T10:00:00.000Z' },
  { id: 'c-5', name: 'Cliente Demo', email: 'cliente@example.org', note: '', createdAt: '2025-02-05T10:00:00.000Z' },
]

export const filters: MailFilter[] = [
  {
    id: 'f-1',
    name: 'Fatture',
    from: 'fatture@example.org',
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
]

export const settings: AppSettings = {
  defaultSignature: 'Mario Rossi\n+39 000 000 0000',
  signatureMode: 'shared',
  allowRemoteImages: false,
  metadataRetentionDays: 90,
}

export const health: HealthStatus = {
  ok: true,
  version: '1.0.1',
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
  installed: '1.0.1',
  latest: '1.0.1',
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
    status: seed.status ?? 'unknown',
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
    subject: 'Rinnovo contratto annuale',
    date: hoursAgo(74),
    text:
      'Ciao Mario,\n\nti confermo che il contratto scade il 30 novembre. Possiamo rivederlo insieme la prossima settimana?\n\nLuca',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-contract-1',
    folder: 'inbox',
    threadKey: 't-contract',
    from: { name: 'Sara Conti', email: 'sara.conti@example.org' },
    to: [{ name: 'Mario Rossi', email: 'mario@example.com' }],
    cc: [{ name: 'Luca Bianchi', email: 'luca.bianchi@example.org' }],
    subject: 'Re: Rinnovo contratto annuale',
    date: hoursAgo(2),
    unread: true,
    text:
      'Perfetto, ho aggiunto le modifiche al punto 3 e allegato la versione aggiornata.\n\nFatemi sapere se va bene per voi.\n\nSara',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-welcome',
    folder: 'inbox',
    threadKey: 't-welcome',
    from: { name: 'WhelkMail', email: 'hello@example.com' },
    subject: 'Benvenuto in WhelkMail',
    date: hoursAgo(5),
    unread: true,
    text:
      'Questa è una demo statica: i messaggi sono finti e nessun dato viene inviato a un server. Esplora inbox, lettura, etichette, ricerca e composizione.',
    labelIds: ['l-read'],
    html:
      '<div style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.6">' +
      '<h1 style="margin:0 0 12px;font-size:22px">Benvenuto in WhelkMail</h1>' +
      '<p>Questa è una <strong>demo statica</strong>: i messaggi sono finti e nessun dato viene inviato a un server.</p>' +
      '<p>Prova la lettura, le etichette, la ricerca e la composizione.</p>' +
      '<p style="color:#6b7280;font-size:12px">Le immagini remote sono bloccate per impostazione predefinita.</p>' +
      '<img src="https://tracker.example.com/pixel.png" width="1" height="1" alt="" style="display:block">' +
      '</div>',
  }),
  makeMessage(imap, {
    id: 'm-invoice',
    folder: 'inbox',
    threadKey: 't-invoice',
    from: { name: 'Fatture Studio', email: 'fatture@example.org' },
    subject: 'Fattura 2026-041',
    date: hoursAgo(9),
    text: 'Buongiorno,\nin allegato la fattura 2026-041.\n\nGrazie,\nFatture Studio',
    labelIds: ['l-invoices'],
    attachments: [
      {
        index: 0,
        filename: 'fattura-2026-041.pdf',
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
    subject: 'Deploy completato',
    date: hoursAgo(20),
    text: 'Il workflow "deploy" è terminato con successo sul branch main.',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-lunch',
    folder: 'inbox',
    threadKey: 't-lunch',
    from: { name: 'Giulia Verdi', email: 'giulia.verdi@example.net' },
    subject: 'Pranzo giovedì?',
    date: hoursAgo(28),
    unread: true,
    text: 'Ciao! Ti va un pranzo giovedì verso le 13? Conosco un posto carino in centro.',
    labelIds: ['l-projects'],
  }),
  makeMessage(imap, {
    id: 'm-usage',
    folder: 'inbox',
    threadKey: 't-usage',
    from: { name: 'Cloudflare', email: 'billing@example.com' },
    subject: 'Riepilogo utilizzo mensile',
    date: hoursAgo(40),
    text: 'Il tuo utilizzo di questo mese rientra nei limiti del piano. Nessuna azione richiesta.',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 'm-design',
    folder: 'inbox',
    threadKey: 't-design',
    from: { name: 'Design Weekly', email: 'news@example.com' },
    subject: 'Le 10 tendenze UI del 2026',
    date: hoursAgo(52),
    text: 'Una selezione delle tendenze di interfaccia più interessanti dell’anno.',
    labelIds: ['l-read'],
    html:
      '<div style="font-family:Georgia,serif;color:#111827;line-height:1.7">' +
      '<h2 style="font-family:Inter,Arial,sans-serif;margin:0 0 12px">Le 10 tendenze UI del 2026</h2>' +
      '<p>Una selezione delle tendenze di interfaccia più interessanti dell’anno.</p>' +
      '<ul><li>Interfacce calme e tipografia generosa</li><li>Contenuti densi ma leggibili</li><li>Movimento discreto</li></ul>' +
      '<img src="https://tracker.example.com/open.gif" width="1" height="1" alt="">' +
      '</div>',
  }),
  makeMessage(imap, {
    id: 's-reply',
    folder: 'sent',
    threadKey: 't-sent-contract',
    from: { name: 'Mario Rossi', email: 'mario@example.com' },
    to: [{ name: 'Luca Bianchi', email: 'luca.bianchi@example.org' }],
    subject: 'Re: Rinnovo contratto annuale',
    date: hoursAgo(70),
    text: 'Ciao Luca,\nperfetto, ci sentiamo la prossima settimana.\n\nMario',
    status: 'sent',
    labelIds: ['l-work'],
  }),
  makeMessage(imap, {
    id: 's-invoice',
    folder: 'sent',
    threadKey: 't-sent-invoice',
    from: { name: 'Mario Rossi', email: 'mario@example.com' },
    to: [{ name: 'Cliente Demo', email: 'cliente@example.org' }],
    subject: 'Fattura 2026-040',
    date: hoursAgo(96),
    text: 'Buongiorno,\nin allegato la fattura 2026-040.\n\nCordiali saluti,\nMario Rossi',
    status: 'sent',
    labelIds: ['l-invoices'],
    attachments: [
      {
        index: 0,
        filename: 'fattura-2026-040.pdf',
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
    subject: 'Proposta progetto — bozza',
    date: hoursAgo(1),
    text: 'Ciao Sara,\nti mando una prima bozza della proposta. Manca ancora la parte sui tempi.',
    status: 'draft',
    labelIds: ['l-projects'],
  }),
  makeMessage(imap, {
    id: 'p-prize',
    folder: 'spam',
    threadKey: 't-spam',
    from: { name: 'Promo', email: 'promo@example.biz' },
    subject: 'Hai vinto un premio!',
    date: hoursAgo(30),
    unread: true,
    text: 'Clicca qui per riscattare il tuo premio. Nessun dato reale è coinvolto in questa demo.',
  }),
  makeMessage(relay, {
    id: 'r-order',
    folder: 'inbox',
    threadKey: 't-order',
    from: { name: 'Cliente Demo', email: 'cliente@example.org' },
    to: [{ name: 'Atelier', email: 'hello@atelier.example' }],
    subject: 'Ordine #1042',
    date: hoursAgo(4),
    unread: true,
    text:
      'Buongiorno,\nvorrei confermare l’ordine #1042 e chiedere se è possibile aggiungere una nota in fattura.\n\nGrazie!',
    labelIds: ['l-work'],
  }),
  makeMessage(relay, {
    id: 'r-quote',
    folder: 'inbox',
    threadKey: 't-quote',
    from: { name: 'Fornitore Stampe', email: 'fornitore@example.net' },
    to: [{ name: 'Atelier', email: 'hello@atelier.example' }],
    subject: 'Preventivo stampe',
    date: hoursAgo(22),
    text: 'In allegato il preventivo per la stampa del catalogo. Restiamo a disposizione.',
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
