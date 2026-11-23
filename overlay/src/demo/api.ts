import type {
  Account,
  AccountCreateInput,
  AccountPatch,
  Contact,
  DraftPayload,
  Folder,
  Label,
  MailFilter,
  Mailbox,
  MailboxSyncState,
  MailThread,
  MessageDetail,
  MessageSearchResult,
  MessageSummary,
  PushPrefs,
  ThreadListResult,
} from '../../shared/types'
import {
  accounts as seedAccounts,
  contacts as seedContacts,
  filters as seedFilters,
  labels as seedLabels,
  makeMessage,
  seedMessages,
  settings as seedSettings,
  storageOptions,
  summarize,
  health as healthStatus,
  updateStatus,
} from './fixtures'

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024
const FOLDERS: Folder[] = ['inbox', 'sent', 'draft', 'spam']
const jsonHeaders = { 'Content-Type': 'application/json' }

interface DemoState {
  accounts: Account[]
  labels: Label[]
  contacts: Contact[]
  filters: MailFilter[]
  settings: typeof seedSettings
  update: typeof updateStatus
  messages: MessageDetail[]
}

const state: DemoState = {
  accounts: seedAccounts.map((account) => ({ ...account })),
  labels: seedLabels.map((label) => ({ ...label })),
  contacts: seedContacts.map((contact) => ({ ...contact })),
  filters: seedFilters.map((filter) => ({ ...filter })),
  settings: { ...seedSettings },
  update: { ...updateStatus },
  messages: seedMessages.map((message) => ({ ...message })),
}

let idCounter = 0

function newId(prefix: string): string {
  idCounter += 1
  return `${prefix}-demo-${idCounter}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function textOrNull(value: unknown, fallback: string | null = null): string | null {
  if (value === undefined) return fallback
  return typeof value === 'string' ? value.trim() || null : null
}

function stringList(value: unknown, fallback: string[]): string[] {
  if (value === undefined) return fallback
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function syncState(account: Account): MailboxSyncState[] {
  return FOLDERS.map((folder) => {
    const total = state.messages.filter(
      (message) => message.accountId === account.id && message.folder === folder,
    ).length
    return {
      folder,
      uidValidity: 1,
      maxUid: total,
      minUid: total > 0 ? 1 : 0,
      backfillDone: true,
      status: total > 0 ? 'done' : 'idle',
      error: null,
      total,
      synced: total,
      lastSyncedAt: nowIso(),
    }
  })
}

function retention() {
  return {
    days: state.settings.metadataRetentionDays,
    lastRunAt: null,
    lastDeleted: 0,
    deletedTotal: 0,
    cutoff: null,
  }
}

function pushPrefs(): PushPrefs[] {
  return state.accounts.map((account) => ({
    accountId: account.id,
    email: account.email,
    enabled: false,
    folders: ['inbox'],
  }))
}

function listThreads(query: URLSearchParams): ThreadListResult {
  const accountId = query.get('accountId') ?? 'all'
  const folder = (query.get('folder') ?? 'inbox') as Folder
  const labelId = query.get('labelId')
  const before = query.get('before')
  const limit = Number(query.get('limit') ?? '20') || 20

  const groups = new Map<string, MessageDetail[]>()
  for (const message of state.messages) {
    if (!labelId && message.folder !== folder) continue
    if (accountId !== 'all' && message.accountId !== accountId) continue
    if (labelId && !message.labelIds.includes(labelId)) continue
    const key = `${message.accountId}:${message.threadKey ?? message.id}`
    const existing = groups.get(key)
    if (existing) {
      existing.push(message)
    } else {
      groups.set(key, [message])
    }
  }

  const threads: MailThread[] = []
  for (const list of groups.values()) {
    list.sort((left, right) => left.date.localeCompare(right.date))
    const latest = list[list.length - 1]
    const participants: Mailbox[] = []
    const seen = new Set<string>()
    for (const message of list) {
      const key = message.from.email.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        participants.push(message.from)
      }
    }
    threads.push({
      threadKey: latest.threadKey ?? latest.id,
      accountId: latest.accountId,
      accountEmail: latest.accountEmail,
      accountName: latest.accountName,
      folder,
      latest: summarize(latest),
      lastAt: latest.date,
      total: list.length,
      unread: list.filter((message) => message.unread).length,
      participants,
    })
  }

  threads.sort((left, right) => right.lastAt.localeCompare(left.lastAt))
  const filtered = before ? threads.filter((thread) => thread.lastAt < before) : threads
  const page = filtered.slice(0, limit)
  const nextCursor =
    filtered.length > limit ? (page[page.length - 1]?.lastAt ?? null) : null
  return {
    threads: page,
    errors: [],
    syncing: false,
    staleAccounts: [],
    activeAccounts: [],
    nextCursor,
  }
}

function threadMessages(query: URLSearchParams): { messages: MessageSummary[] } {
  const accountId = query.get('accountId') ?? 'all'
  const threadKey = query.get('threadKey') ?? ''
  const list = state.messages.filter(
    (message) =>
      (accountId === 'all' || message.accountId === accountId) &&
      (message.threadKey ?? message.id) === threadKey,
  )
  list.sort((left, right) => left.date.localeCompare(right.date))
  return { messages: list.map(summarize) }
}

function searchMessages(query: URLSearchParams): MessageSearchResult {
  const needle = (query.get('q') ?? '').toLowerCase()
  const accountId = query.get('accountId') ?? 'all'
  const folder = query.get('folder') ?? 'all'
  const before = query.get('before')

  const matches = state.messages.filter((message) => {
    if (accountId !== 'all' && message.accountId !== accountId) return false
    if (folder !== 'all' && message.folder !== folder) return false
    const haystack = [
      message.subject,
      message.snippet,
      message.from.name ?? '',
      message.from.email,
      ...message.to.map((recipient) => `${recipient.name ?? ''} ${recipient.email}`),
    ]
      .join(' ')
      .toLowerCase()
    return needle.length === 0 || haystack.includes(needle)
  })
  matches.sort((left, right) => right.date.localeCompare(left.date))
  const filtered = before ? matches.filter((message) => message.date < before) : matches
  const limit = 20
  const page = filtered.slice(0, limit)
  const contacts = state.contacts.filter((contact) =>
    `${contact.name} ${contact.email}`.toLowerCase().includes(needle),
  )
  return {
    messages: page.map(summarize),
    contacts,
    errors: [],
    nextCursor: filtered.length > limit ? (page[page.length - 1]?.date ?? null) : null,
  }
}

function messageActions(body: {
  ids?: unknown
  action?: unknown
  target?: unknown
}): { ok: boolean; moved: number; skipped: string[]; errors: [] } {
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === 'string')
    : []
  const action = body.action
  const target = body.target
  let moved = 0

  for (const id of ids) {
    const index = state.messages.findIndex((message) => message.id === id)
    if (index < 0) continue
    if (action === 'delete' || (action === 'move' && target === 'trash')) {
      state.messages.splice(index, 1)
      moved += 1
    } else if (action === 'spam') {
      state.messages[index] = { ...state.messages[index], folder: 'spam' }
      moved += 1
    } else if (action === 'move' && (target === 'inbox' || target === 'spam')) {
      state.messages[index] = { ...state.messages[index], folder: target }
      moved += 1
    }
  }

  return { ok: true, moved, skipped: [], errors: [] }
}

function sendMessage(body: {
  accountId?: unknown
  fromEmail?: unknown
  to?: unknown
  cc?: unknown
  bcc?: unknown
  subject?: unknown
  text?: unknown
  html?: unknown
}): { ok: boolean; sentFolder?: string } {
  const account =
    state.accounts.find((item) => item.id === body.accountId) ?? state.accounts[0]
  if (!account) return { ok: false }

  const addresses = (value: unknown): Mailbox[] =>
    Array.isArray(value)
      ? value
          .filter((email): email is string => typeof email === 'string' && email.length > 0)
          .map((email) => ({ name: null, email }))
      : []

  const detail = makeMessage(account, {
    id: newId('m'),
    folder: 'sent',
    threadKey: newId('t'),
    from: {
      name: account.displayName,
      email:
        typeof body.fromEmail === 'string' && body.fromEmail
          ? body.fromEmail
          : account.email,
    },
    to: addresses(body.to),
    cc: addresses(body.cc),
    bcc: addresses(body.bcc),
    subject: typeof body.subject === 'string' ? body.subject : '(no subject)',
    date: nowIso(),
    text: typeof body.text === 'string' ? body.text : '',
    html: typeof body.html === 'string' ? body.html : null,
    status: 'sent',
  })
  state.messages.push(detail)
  if (state.settings.contactAutoAdd) {
    for (const recipient of [...detail.to, ...detail.cc, ...detail.bcc]) {
      const email = recipient.email.toLowerCase()
      if (state.contacts.some((contact) => contact.email.toLowerCase() === email)) {
        continue
      }
      state.contacts.push({
        id: newId('c'),
        ...contactFromInput({ name: recipient.name ?? email, email }),
        source: 'auto',
        firstName: '',
        lastName: '',
        createdAt: nowIso(),
      })
    }
  }
  return { ok: true, sentFolder: 'Sent' }
}

function draftPayload(message: MessageDetail): DraftPayload {
  return {
    id: message.id,
    accountId: message.accountId,
    to: message.to.map((recipient) => recipient.email),
    cc: message.cc.map((recipient) => recipient.email),
    bcc: message.bcc.map((recipient) => recipient.email),
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: [],
  }
}

function saveDraft(body: {
  accountId?: unknown
  draftId?: unknown
  to?: unknown
  cc?: unknown
  bcc?: unknown
  subject?: unknown
  text?: unknown
  html?: unknown
}): { ok: boolean; draftId?: string } {
  const account =
    state.accounts.find((item) => item.id === body.accountId) ?? state.accounts[0]
  if (!account) return { ok: false }

  const addresses = (value: unknown): Mailbox[] =>
    Array.isArray(value)
      ? value
          .filter((email): email is string => typeof email === 'string' && email.length > 0)
          .map((email) => ({ name: null, email }))
      : []

  const existingId = typeof body.draftId === 'string' ? body.draftId : null
  const existing = existingId
    ? state.messages.find((message) => message.id === existingId)
    : undefined

  if (existing) {
    existing.subject = typeof body.subject === 'string' ? body.subject : existing.subject
    existing.text = typeof body.text === 'string' ? body.text : existing.text
    existing.html = typeof body.html === 'string' ? body.html : existing.html
    existing.to = addresses(body.to)
    existing.cc = addresses(body.cc)
    existing.bcc = addresses(body.bcc)
    existing.date = nowIso()
    return { ok: true, draftId: existing.id }
  }

  const detail = makeMessage(account, {
    id: newId('d'),
    folder: 'draft',
    threadKey: newId('t'),
    from: { name: account.displayName, email: account.email },
    to: addresses(body.to),
    cc: addresses(body.cc),
    bcc: addresses(body.bcc),
    subject: typeof body.subject === 'string' ? body.subject : '(no subject)',
    date: nowIso(),
    text: typeof body.text === 'string' ? body.text : '',
    html: typeof body.html === 'string' ? body.html : null,
    status: 'draft',
  })
  state.messages.push(detail)
  return { ok: true, draftId: detail.id }
}

function accountFromInput(input: AccountCreateInput): Account {
  return {
    id: newId('acc'),
    email: input.email,
    displayName: input.displayName || input.email,
    kind: input.kind,
    imapHost: input.imapHost ?? null,
    imapPort: input.imapPort ?? null,
    imapSecurity: input.imapSecurity ?? null,
    smtpHost: input.smtpHost ?? null,
    smtpPort: input.smtpPort ?? null,
    smtpSecurity: input.smtpSecurity ?? null,
    username: input.username ?? input.email,
    authType: input.authType ?? 'password',
    oauthProvider: input.oauthProvider ?? null,
    connected: true,
    signature: '',
    signatureHtml: '',
    incomingLabelId: null,
    archiveImapBodies: false,
    imapArchiveDriver: 'r2',
    deleteAfterArchive: false,
    autoSync: false,
    syncIntervalMinutes: 5,
    autoReplyEnabled: false,
    autoReplySubject: '',
    autoReplyBody: '',
    autoReplyBodyHtml: '',
    sentFolder: 'Sent',
    autoSavesSent: input.autoSavesSent ?? true,
    sentCopyAccountId: input.sentCopyAccountId ?? null,
    replyAccountId: null,
    relayAnyAddress: false,
    maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
    storageDriver: input.storageDriver ?? (input.kind === 'relay' ? 'r2' : 'provider'),
    relayProvider: input.relayProvider ?? null,
    relayConfigured: input.kind === 'relay',
    driveConnected: false,
    r2Available: true,
    createdAt: nowIso(),
  }
}

function contactFromInput(
  body: Record<string, unknown>,
  existing?: Contact,
): Omit<Contact, 'id' | 'createdAt'> {
  const text = (value: unknown, fallback: string) =>
    typeof value === 'string' ? value : fallback
  const list = (value: unknown, fallback: string[]) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : fallback
  return {
    name: text(body.name, existing?.name ?? ''),
    email: text(body.email, existing?.email ?? '').toLowerCase(),
    note: text(body.note, existing?.note ?? ''),
    source: 'manual',
    firstName: text(body.firstName, existing?.firstName ?? ''),
    lastName: text(body.lastName, existing?.lastName ?? ''),
    company: text(body.company, existing?.company ?? ''),
    jobTitle: text(body.jobTitle, existing?.jobTitle ?? ''),
    phone: text(body.phone, existing?.phone ?? ''),
    address: text(body.address, existing?.address ?? ''),
    website: text(body.website, existing?.website ?? ''),
    birthday: text(body.birthday, existing?.birthday ?? ''),
    additionalEmails: list(body.additionalEmails, existing?.additionalEmails ?? []),
    additionalPhones: list(body.additionalPhones, existing?.additionalPhones ?? []),
  }
}

function handle(
  method: string,
  path: string,
  query: URLSearchParams,
  body: Record<string, unknown> & {
    id?: unknown
    draftId?: unknown
    version?: unknown
    action?: unknown
    target?: unknown
    ids?: unknown
    accountId?: unknown
    fromEmail?: unknown
    to?: unknown
    cc?: unknown
    bcc?: unknown
    subject?: unknown
    text?: unknown
    html?: unknown
    password?: unknown
    name?: unknown
    email?: unknown
    note?: unknown
    color?: unknown
    from?: unknown
    hasWords?: unknown
    doesntHave?: unknown
    hasAttachment?: unknown
    forwardTo?: unknown
    labelIds?: unknown
    enabled?: unknown
  },
): Response {
  if (path === '/api/health') {
    return json(healthStatus)
  }

  if (path === '/api/update') {
    if (method === 'POST') {
      const version = typeof body.version === 'string' ? body.version : ''
      state.update = { ...state.update, dismissed: version !== '' }
    }
    return json(state.update)
  }

  if (path === '/api/auth/login' && method === 'POST') {
    return json({ ok: true })
  }
  if (path === '/api/auth/2fa' && method === 'POST') {
    return json({ ok: true })
  }
  if (path === '/api/auth/logout') {
    return json({ ok: true })
  }
  if (path === '/api/auth/totp') {
    if (method === 'GET') {
      return json({ enabled: false, recoveryRemaining: 0 })
    }
    if (body.action === 'setup') {
      return json({
        secret: 'DEMO2FASECRETDEMO',
        otpauth:
          'otpauth://totp/WhelkMail:demo?secret=DEMO2FASECRETDEMO&issuer=WhelkMail',
      })
    }
    if (body.action === 'enable') {
      return json({ recoveryCodes: ['DEMO-0001', 'DEMO-0002'] })
    }
    return json({ ok: true })
  }

  if (path === '/api/storage/options') {
    return json(storageOptions)
  }
  if (path === '/api/storage/cleanup') {
    return method === 'DELETE' ? json({ ok: true }) : json({ entries: [] })
  }
  if (path === '/api/retention') {
    if (method === 'POST') {
      return json({ ok: true, accounts: 0, folders: 0, retention: retention() })
    }
    return json({ retention: retention() })
  }

  if (path === '/api/accounts') {
    if (method === 'POST') {
      const account = accountFromInput(body as unknown as AccountCreateInput)
      state.accounts.push(account)
      return json({ account })
    }
    return json({ accounts: state.accounts })
  }

  if (path === '/api/accounts/sync') {
    return json({ accounts: [], hasMore: false })
  }

  const accountSync = /^\/api\/accounts\/([^/]+)\/sync$/.exec(path)
  if (accountSync) {
    const account = state.accounts.find(
      (item) => item.id === decodeURIComponent(accountSync[1]),
    )
    if (!account) return json({ error: 'Account not found' }, 404)
    return json({ folders: syncState(account), hasMore: false })
  }

  const accountTest = /^\/api\/accounts\/([^/]+)\/test$/.exec(path)
  if (accountTest) {
    return json({ ok: true, checks: { imap: 'ok', smtp: 'ok' } })
  }

  const accountDeletions = /^\/api\/accounts\/([^/]+)\/deletions$/.exec(path)
  if (accountDeletions) {
    return json({ logs: [] })
  }

  const accountOne = /^\/api\/accounts\/([^/]+)$/.exec(path)
  if (accountOne) {
    const id = decodeURIComponent(accountOne[1])
    const index = state.accounts.findIndex((item) => item.id === id)
    if (index < 0) return json({ error: 'Account not found' }, 404)
    if (method === 'PATCH') {
      state.accounts[index] = {
        ...state.accounts[index],
        ...(body as unknown as AccountPatch),
      }
      return json({ account: state.accounts[index] })
    }
    if (method === 'DELETE') {
      state.accounts.splice(index, 1)
      state.messages = state.messages.filter((message) => message.accountId !== id)
      return json({ ok: true })
    }
    return json({ account: state.accounts[index] })
  }

  if (path === '/api/sync') {
    return json({
      accounts: state.accounts.map((account) => ({
        accountId: account.id,
        email: account.email,
        syncing: false,
        folders: syncState(account),
      })),
      syncing: false,
    })
  }

  if (path === '/api/labels') {
    if (method === 'POST') {
      const label: Label = {
        id: newId('l'),
        name: typeof body.name === 'string' ? body.name : 'Label',
        color: (typeof body.color === 'string' ? body.color : 'blue') as Label['color'],
        createdAt: nowIso(),
      }
      state.labels.push(label)
      return json({ label })
    }
    return json({ labels: state.labels })
  }

  const labelOne = /^\/api\/labels\/([^/]+)$/.exec(path)
  if (labelOne) {
    const id = decodeURIComponent(labelOne[1])
    const index = state.labels.findIndex((item) => item.id === id)
    if (index < 0) return json({ error: 'Label not found' }, 404)
    if (method === 'PATCH') {
      state.labels[index] = {
        ...state.labels[index],
        name: typeof body.name === 'string' ? body.name : state.labels[index].name,
        color:
          typeof body.color === 'string'
            ? (body.color as Label['color'])
            : state.labels[index].color,
      }
      return json({ label: state.labels[index] })
    }
    if (method === 'DELETE') {
      state.labels.splice(index, 1)
      return json({ ok: true })
    }
    return json({ label: state.labels[index] })
  }

  if (path === '/api/contacts') {
    if (method === 'POST') {
      const existing = state.contacts.find(
        (contact) =>
          contact.email.toLowerCase() ===
          String(body.email ?? '').trim().toLowerCase(),
      )
      if (existing) {
        Object.assign(existing, contactFromInput(body, existing))
        return json({ contact: existing })
      }
      const contact: Contact = {
        id: newId('c'),
        ...contactFromInput(body),
        createdAt: nowIso(),
      }
      state.contacts.push(contact)
      return json({ contact })
    }
    const needle = (query.get('q') ?? '').toLowerCase()
    const contacts = needle
      ? state.contacts.filter((contact) =>
          [
            contact.name,
            contact.email,
            contact.company,
            contact.jobTitle,
            contact.phone,
          ]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        )
      : state.contacts
    return json({ contacts })
  }

  if (path === '/api/contacts/import' && method === 'POST') {
    const inputs = Array.isArray(body.contacts) ? body.contacts : []
    let imported = 0
    let updated = 0
    for (const input of inputs) {
      if (!input || typeof input !== 'object') continue
      const data = input as Record<string, unknown>
      const email = String(data.email ?? '').trim().toLowerCase()
      if (!email) continue
      const existing = state.contacts.find(
        (contact) => contact.email.toLowerCase() === email,
      )
      if (existing) {
        Object.assign(existing, contactFromInput(data, existing))
        updated += 1
      } else {
        state.contacts.push({
          id: newId('c'),
          ...contactFromInput(data),
          createdAt: nowIso(),
        })
        imported += 1
      }
    }
    return json({ imported, updated })
  }

  const contactOne = /^\/api\/contacts\/([^/]+)$/.exec(path)
  if (contactOne) {
    const id = decodeURIComponent(contactOne[1])
    const index = state.contacts.findIndex((item) => item.id === id)
    if (index < 0) return json({ error: 'Contact not found' }, 404)
    if (method === 'PATCH') {
      state.contacts[index] = {
        ...state.contacts[index],
        ...contactFromInput(body, state.contacts[index]),
      }
      return json({ contact: state.contacts[index] })
    }
    if (method === 'DELETE') {
      state.contacts.splice(index, 1)
      return json({ ok: true })
    }
    return json({ contact: state.contacts[index] })
  }

  if (path === '/api/filters') {
    if (method === 'POST') {
      const filter: MailFilter = {
        id: newId('f'),
        accountId: typeof body.accountId === 'string' ? body.accountId : '',
        autoLabel: false,
        name: typeof body.name === 'string' && body.name.trim() ? body.name : 'Filter',
        from: textOrNull(body.from),
        to: textOrNull(body.to),
        subject: textOrNull(body.subject),
        hasWords: textOrNull(body.hasWords),
        doesntHave: textOrNull(body.doesntHave),
        hasAttachment: body.hasAttachment === true,
        labelIds: stringList(body.labelIds, []),
        forwardTo: stringList(body.forwardTo, []),
        enabled: body.enabled !== false,
        createdAt: nowIso(),
        lastForwardStatus: null,
        lastForwardError: null,
        lastForwardAt: null,
      }
      state.filters.push(filter)
      return json({ filter })
    }
    return json({ filters: state.filters })
  }

  if (path === '/api/filters/apply' && method === 'POST') {
    return json({ processed: 0, matched: 0, labelled: 0, forwarded: 0, nextCursor: null })
  }

  const filterOne = /^\/api\/filters\/([^/]+)$/.exec(path)
  if (filterOne) {
    const id = decodeURIComponent(filterOne[1])
    const index = state.filters.findIndex((item) => item.id === id)
    if (index < 0) return json({ error: 'Filter not found' }, 404)
    if (method === 'DELETE') {
      state.filters.splice(index, 1)
      return json({ ok: true })
    }
    if (method === 'PATCH') {
      const current = state.filters[index]
      state.filters[index] = {
        ...current,
        name: typeof body.name === 'string' && body.name.trim() ? body.name : current.name,
        from: textOrNull(body.from, current.from),
        to: textOrNull(body.to, current.to),
        subject: textOrNull(body.subject, current.subject),
        hasWords: textOrNull(body.hasWords, current.hasWords),
        doesntHave: textOrNull(body.doesntHave, current.doesntHave),
        hasAttachment:
          typeof body.hasAttachment === 'boolean'
            ? body.hasAttachment
            : current.hasAttachment,
        labelIds: stringList(body.labelIds, current.labelIds),
        forwardTo: stringList(body.forwardTo, current.forwardTo),
        enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      }
      return json({ filter: state.filters[index] })
    }
    return json({ filter: state.filters[index] })
  }

  if (path === '/api/settings') {
    if (method === 'PATCH') {
      state.settings = {
        ...state.settings,
        ...body,
      } as unknown as typeof state.settings
    }
    return json(state.settings)
  }

  if (path === '/api/push/key') {
    return json({ publicKey: null })
  }
  if (path === '/api/push/prefs') {
    if (method === 'PATCH') {
      return json({ ok: true, prefs: pushPrefs() })
    }
    return json({ prefs: pushPrefs() })
  }
  if (path === '/api/push/subscribe') {
    return json({ ok: true })
  }

  if (path === '/api/threads/rebuild') {
    if (method === 'POST') {
      return json({ updated: 0, pending: 0 })
    }
    return json({
      accounts: state.accounts.map((account) => ({
        accountId: account.id,
        email: account.email,
        pending: 0,
        messages: 0,
        threads: 0,
      })),
    })
  }

  if (path === '/api/threads/messages') {
    return json(threadMessages(query))
  }

  if (path === '/api/threads') {
    return json(listThreads(query))
  }

  if (path === '/api/messages/search') {
    return json(searchMessages(query))
  }

  if (path === '/api/messages/actions' && method === 'POST') {
    return json(messageActions(body))
  }

  if (path === '/api/messages/send' && method === 'POST') {
    return json(sendMessage(body))
  }

  if (path === '/api/drafts' && method === 'POST') {
    return json(saveDraft(body))
  }

  const draftOne = /^\/api\/drafts\/([^/]+)$/.exec(path)
  if (draftOne) {
    const id = decodeURIComponent(draftOne[1])
    state.messages = state.messages.filter((message) => message.id !== id)
    return json({ ok: true })
  }

  const messageLabels = /^\/api\/messages\/([^/]+)\/labels$/.exec(path)
  if (messageLabels) {
    const id = decodeURIComponent(messageLabels[1])
    const message = state.messages.find((item) => item.id === id)
    if (!message) return json({ error: 'Message not found' }, 404)
    const labelIds = Array.isArray(body.labelIds)
      ? body.labelIds.filter((labelId): labelId is string => typeof labelId === 'string')
      : []
    message.labelIds = labelIds
    return json({ ok: true, labelIds })
  }

  const messageDraft = /^\/api\/messages\/([^/]+)\/draft$/.exec(path)
  if (messageDraft) {
    const id = decodeURIComponent(messageDraft[1])
    const message = state.messages.find((item) => item.id === id)
    if (!message) return json({ error: 'Message not found' }, 404)
    return json({ draft: draftPayload(message) })
  }

  const messageRaw = /^\/api\/messages\/([^/]+)\/raw$/.exec(path)
  if (messageRaw) {
    return new Response('Demo: the raw message is not available in this build.\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const messageAttachment = /^\/api\/messages\/([^/]+)\/attachments\/\d+$/.exec(path)
  if (messageAttachment) {
    return new Response('Demo attachment\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const messageOne = /^\/api\/messages\/([^/]+)$/.exec(path)
  if (messageOne) {
    const id = decodeURIComponent(messageOne[1])
    const message = state.messages.find((item) => item.id === id)
    if (!message) return json({ error: 'Message not found' }, 404)
    return json({ message })
  }

  if (method === 'POST' && path === '/api/config/export') {
    return json({
      format: 'whelkmail-config',
      version: 1,
      createdAt: new Date().toISOString(),
      kdf: { name: 'PBKDF2-SHA256', iterations: 100000, salt: 'ZGVtby1zYWx0LWRlbW8=' },
      iv: 'ZGVtby1pdi0xMjM=',
      ciphertext: 'ZGVtby1jaXBoZXJ0ZXh0LWRlbW8=',
    })
  }

  if (method === 'POST' && path === '/api/config/import') {
    return json({
      ok: true,
      counts: {
        accounts: state.accounts.length,
        labels: state.labels.length,
        filters: state.filters.length,
        contacts: state.contacts.length,
        pushPrefs: 0,
        settings: 1,
      },
    })
  }

  return json({ error: 'Not available in the demo' }, 404)
}

export function installDemoApi(): void {
  const original = window.fetch.bind(window)

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const raw =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const url = new URL(raw, window.location.href)

    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
      return original(input, init)
    }

    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase()

    let body: Record<string, unknown> = {}
    if (typeof init?.body === 'string' && init.body.length > 0) {
      try {
        const parsed: unknown = JSON.parse(init.body)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          body = parsed as Record<string, unknown>
        }
      } catch {
        body = {}
      }
    }

    await sleep(90 + Math.random() * 160)
    return handle(method, url.pathname, url.searchParams, body)
  }
}
