import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const mode = process.argv[2] === 'development' ? 'dev' : 'test'
const projectRoot = resolve(import.meta.dirname, '..')
const outputDirectory = resolve(projectRoot, 'dist', 'deploy')

await mkdir(outputDirectory, { recursive: true })
await Promise.all([
  copyFile(
    resolve(projectRoot, 'deploy', 'deploy.sh'),
    resolve(projectRoot, 'dist', 'deploy.sh'),
  ),
  copyFile(
    resolve(projectRoot, 'deploy', 'nginx.dev.conf'),
    resolve(outputDirectory, 'nginx.dev.conf'),
  ),
  copyFile(
    resolve(projectRoot, 'deploy', 'nginx.test.conf'),
    resolve(outputDirectory, 'nginx.test.conf'),
  ),
  copyFile(
    resolve(projectRoot, 'deploy', 'docker-compose.server.yml'),
    resolve(outputDirectory, 'docker-compose.yml'),
  ),
])

console.log(`Deployment files prepared for ${mode} mode.`)
