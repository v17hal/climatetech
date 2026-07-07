import { execSync } from 'child_process'
import path from 'path'

/** Push the schema into a dedicated SQLite test database before tests run. */
export default function setup() {
  execSync('npx prisma db push --force-reset --skip-generate', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  })
}
