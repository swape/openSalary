import { spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const host = '127.0.0.1'
const port = '4321'
const url = `http://${host}:${port}/`

async function isServerAvailable() {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

function stopServer() {
  spawnSync('npx', ['astro', 'dev', 'stop'], { stdio: 'ignore' })
}

export default async function globalSetup() {
  if (await isServerAvailable()) {
    return
  }

  stopServer()
  const result = spawnSync(
    'npm',
    ['run', 'dev', '--', '--host', host, '--port', port],
    { stdio: 'inherit' }
  )

  if (result.error) {
    throw result.error
  }

  try {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (await isServerAvailable()) {
        return stopServer
      }

      await delay(250)
    }

    throw new Error(`Astro did not become available at ${url}`)
  } catch (error) {
    stopServer()
    throw error
  }
}
