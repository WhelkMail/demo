# WhelkMail demo

A static, backend-free preview of [WhelkMail](https://github.com/WhelkMail/WhelkMail).

You can try the demo on [demo.whelkmail.eu](https://demo.whelkmail.demo)

The demo reuses the real UI but replaces every API call with an in-memory mock.
There is no Pages Function, no D1, no R2, no IMAP/SMTP and no network access:
the browser cannot reach any mail server or read any real data.

## How it works

This repository does not copy the application source. The build script:

1. checks out the public source (`WhelkMail/WhelkMail`, `main` by default);
2. copies only the UI paths (`src`, `shared`, `public`, configs) — never
   `functions`, `worker`, `db`, `wrangler.toml`, `.dev.vars` or `.env`;
3. applies the [`overlay/`](overlay) directory:
   - `src/demo-main.tsx` boots the real `App` without the service worker;
   - `src/demo/api.ts` intercepts `window.fetch('/api/*')` and answers from
     in-memory fixtures;
   - `src/demo/fixtures.ts` contains fake accounts, messages and settings;
   - `index.html` and `public/_headers` set a strict CSP (`connect-src 'none'`);
4. builds a plain static site into `dist/`.

Every message, address and attachment is fake and uses `example.com` /
`example.org` domains. Sending, deleting, labels and search only change the
in-memory state of the current tab.

## Build locally

```bash
npm run build
```

`dist/` is then a self-contained static site.

To build against a local checkout of the app instead of cloning GitHub:

```bash
# Windows PowerShell
$env:SOURCE_DIR = "C:\mail-client"; npm run build

# POSIX
SOURCE_DIR=/path/to/whelkmail npm run build
```

Optional variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SOURCE_REPO` | `https://github.com/WhelkMail/WhelkMail.git` | Source repository |
| `SOURCE_REF` | `main` | Branch or tag to build |
| `SOURCE_DIR` | unset | Build from a local source directory |

## Deploy

The GitHub Actions workflow in [`.github/workflows/build.yml`](.github/workflows/build.yml)
builds on every push, on demand and weekly, and uploads `dist` as an artifact.

To publish to Cloudflare Pages automatically, add two repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The workflow then runs `wrangler pages deploy dist --project-name whelkmail-demo`.
Without the secrets it only produces the artifact.

You can also deploy manually:

```bash
npm run deploy
```

## License

MIT, same as WhelkMail. See [LICENSE](LICENSE).
