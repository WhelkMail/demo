import { execSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const work = join(root, '.build')
const source = join(work, 'source')
const dist = join(root, 'dist')

const repoUrl = process.env.SOURCE_REPO ?? 'https://github.com/WhelkMail/WhelkMail.git'
const ref = process.env.SOURCE_REF ?? 'main'
const localSource = process.env.SOURCE_DIR

// Only these paths are copied from the upstream project. Nothing that could
// carry a deployment config or credentials (wrangler.toml, .dev.vars, .env,
// functions, worker, db) is ever part of the demo build.
const allowlist = [
  'src',
  'shared',
  'public',
  'index.html',
  '.gitignore',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'tsconfig.functions.json',
]

function mergeCopy(from, to) {
  if (!existsSync(from)) {
    return
  }
  const stat = statSync(from)
  if (stat.isDirectory()) {
    mkdirSync(to, { recursive: true })
    for (const entry of readdirSync(from)) {
      mergeCopy(join(from, entry), join(to, entry))
    }
    return
  }
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to)
}

rmSync(work, { recursive: true, force: true })
rmSync(dist, { recursive: true, force: true })
mkdirSync(source, { recursive: true })

if (localSource) {
  const base = resolve(localSource)
  console.log(`Using local source: ${base}`)
  for (const entry of allowlist) {
    mergeCopy(join(base, entry), join(source, entry))
  }
  // A repository marker keeps Tailwind's automatic content detection inside the
  // build directory instead of walking up into the parent checkout.
  execSync('git init -q', { cwd: source })
} else {
  console.log(`Cloning ${repoUrl} (${ref})`)
  execSync(`git clone --depth 1 --branch ${ref} ${repoUrl} source`, {
    cwd: work,
    stdio: 'inherit',
  })
}

// The overlay is the only demo-specific code. It replaces the entry HTML and
// Vite config, and adds the mock API under src/demo.
console.log('Applying demo overlay')
for (const entry of readdirSync(join(root, 'overlay'))) {
  mergeCopy(join(root, 'overlay', entry), join(source, entry))
}

console.log('Installing upstream dependencies')
execSync('npm ci', { cwd: source, stdio: 'inherit' })

console.log('Building the static demo')
execSync('npm run build', { cwd: source, stdio: 'inherit' })

if (!existsSync(join(source, 'dist', 'index.html'))) {
  throw new Error('build produced no dist/index.html')
}

cpSync(join(source, 'dist'), dist, { recursive: true })
console.log(`Done: ${dist}`)
