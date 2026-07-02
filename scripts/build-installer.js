/**
 * build-installer.js — Automated Installer Packager
 * Runs electron-builder, compiles Inno Setup (if available), and generates latest.yml for electron-updater.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const packageJson = require('../package.json')
const appVersion = packageJson.version

// Standard paths for Inno Setup compiler
const ISCC_PATHS = [
  'ISCC.exe', // if on PATH
  path.join(process.env.LOCALAPPDATA || '', 'Programs\\Inno Setup 6\\ISCC.exe'),
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files\\Inno Setup 6\\ISCC.exe'
]

function findISCC() {
  for (const isccPath of ISCC_PATHS) {
    if (isccPath === 'ISCC.exe') {
      try {
        execSync('where ISCC.exe', { stdio: 'ignore' })
        return 'ISCC.exe'
      } catch {
        continue
      }
    }
    if (fs.existsSync(isccPath)) {
      return isccPath
    }
  }
  return null
}

function calculateSha512(filePath) {
  const hash = crypto.createHash('sha512')
  const fileBuffer = fs.readFileSync(filePath)
  hash.update(fileBuffer)
  return hash.digest('base64') // electron-updater expects base64 encoded hashes
}

async function run() {
  console.log('Step 0: Compiling source code (npx electron-vite build)...')
  execSync('npx electron-vite build', { stdio: 'inherit' })

  console.log('\nStep 1: Running electron-builder to generate unpacked directory...')
  execSync('npx electron-builder build --win --dir', { stdio: 'inherit' })

  console.log('\nWaiting 2 seconds for Windows file system flush...')
  execSync('node -e "setTimeout(() => {}, 2000)"')

  console.log('\nStep 2: Locating Inno Setup Compiler (ISCC)...')
  const isccPath = findISCC()

  if (isccPath) {
    console.log(`Found Inno Setup Compiler at: ${isccPath}`)
    console.log('Compiling installer.iss...')
    execSync(`"${isccPath}" installer.iss`, { stdio: 'inherit' })
  } else {
    console.warn('\n⚠️ Inno Setup Compiler (ISCC.exe) was not found in environment PATH or standard program directories.')
    console.warn('To compile the final installer, please install Inno Setup 6 (https://jrsoftware.org/isdl.php).')
    console.warn('You can then compile manually by running: ISCC.exe installer.iss\n')
  }

  const setupFile = path.join(__dirname, '../dist/The-Last-Guildmaster-Setup.exe')
  if (fs.existsSync(setupFile)) {
    console.log('\nStep 3: Calculating hash and generating latest.yml for electron-updater...')
    const size = fs.statSync(setupFile).size
    const sha512 = calculateSha512(setupFile)
    const releaseDate = new Date().toISOString()

    const latestYamlContent = `version: ${appVersion}
files:
  - url: The-Last-Guildmaster-Setup.exe
    sha512: ${sha512}
    size: ${size}
path: The-Last-Guildmaster-Setup.exe
sha512: ${sha512}
releaseDate: '${releaseDate}'
`
    const yamlPath = path.join(__dirname, '../dist/latest.yml')
    fs.writeFileSync(yamlPath, latestYamlContent, 'utf-8')
    console.log(`Generated: ${yamlPath}`)
    console.log('latest.yml contents:')
    console.log(latestYamlContent)
  } else {
    console.log('\nStep 3: Skipping latest.yml generation because setup file does not exist (ISCC compilation skipped).')
  }

  console.log('\nDone!')
}

run().catch((err) => {
  console.error('Packaging failed:', err)
  process.exit(1)
})
