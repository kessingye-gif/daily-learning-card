import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'database.sqlite');
export const db = new Database(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(username)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner','admin','member')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','pending')),
      invited_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (invited_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      invitee_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (inviter_id) REFERENCES users(id),
      FOREIGN KEY (invitee_id) REFERENCES users(id),
      UNIQUE(group_id, invitee_id)
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      admin_id TEXT,
      group_id TEXT,
      likes_count INTEGER DEFAULT 0,
      favorites_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      FOREIGN KEY (admin_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      card_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, card_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      card_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, card_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      card_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );
  `);

  const runMigrationStep = (label: string, action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error(`Migration step "${label}" failed:`, error);
    }
  };

  runMigrationStep('users.created_at', () => {
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasCreatedAt = userColumns.some(col => col.name === 'created_at');
    if (!hasCreatedAt) {
      db.exec("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
      console.log("Migration: Added created_at to users table");
    }
  });

  runMigrationStep('users.password_hash', () => {
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasPasswordHash = userColumns.some(col => col.name === 'password_hash');
    if (!hasPasswordHash) {
      db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''");
      db.exec("UPDATE users SET password_hash = '' WHERE password_hash IS NULL");
      console.log("Migration: Added password_hash to users table");
    }
  });

  runMigrationStep('users.unique_username_index', () => {
    const duplicateNames = db.prepare(`
      SELECT username
      FROM users
      WHERE username IS NOT NULL AND username <> ''
      GROUP BY username
      HAVING COUNT(*) > 1
    `).all() as { username: string }[];

    if (duplicateNames.length > 0) {
      const loadDuplicates = db.prepare(`
        SELECT id
        FROM users
        WHERE username = ?
        ORDER BY COALESCE(created_at, CURRENT_TIMESTAMP), rowid
      `);
      const updateUsername = db.prepare('UPDATE users SET username = ? WHERE id = ?');
      const usernameExists = db.prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1');

      for (const entry of duplicateNames) {
        const rows = loadDuplicates.all(entry.username) as { id: string }[];
        rows.slice(1).forEach(row => {
          let candidate: string;
          do {
            candidate = `${entry.username}_${randomBytes(3).toString('hex')}`;
          } while (usernameExists.get(candidate));
          updateUsername.run(candidate, row.id);
          console.warn(`[Migration] Renamed duplicate username "${entry.username}" to "${candidate}" (user ${row.id}).`);
        });
      }
    }

    const indexes = db.prepare("PRAGMA index_list(users)").all() as any[];
    const hasUsernameUnique = indexes.some(index => index.name === 'idx_users_username_unique');
    if (!hasUsernameUnique) {
      db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username)");
      console.log("Migration: Added unique index on username");
    }
  });

  runMigrationStep('cards.group_id', () => {
    const cardsColumns = db.prepare("PRAGMA table_info(cards)").all() as any[];
    const hasGroupId = cardsColumns.some(col => col.name === 'group_id');
    if (!hasGroupId) {
      db.exec("ALTER TABLE cards ADD COLUMN group_id TEXT");
      console.log("Migration: Added group_id to cards table");
    }
  });

  runMigrationStep('group_members.group_index', () => {
    const groupMemberIndexes = db.prepare("PRAGMA index_list(group_members)").all() as any[];
    const hasMemberIndex = groupMemberIndexes.some(index => index.name === 'idx_group_members_group');
    if (!hasMemberIndex) {
      db.exec("CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)");
    }
  });
}
