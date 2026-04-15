import "dotenv/config";
import process from "node:process";
import { Client } from "pg";

const sourceUrl = process.env.NEON_DATABASE_URL || process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL || process.env.TARGET_DATABASE_URL;

if (!sourceUrl) {
  console.error("NEON_DATABASE_URL (yoki SOURCE_DATABASE_URL) topilmadi.");
  process.exit(1);
}

if (!targetUrl) {
  console.error("DATABASE_URL (yoki TARGET_DATABASE_URL) topilmadi.");
  process.exit(1);
}

if (sourceUrl === targetUrl) {
  console.error("Source va target bir xil URL bo'la olmaydi.");
  process.exit(1);
}

const q = (id) => `"${String(id).replace(/"/g, '""')}"`;
const qs = (text) => `'${String(text).replace(/'/g, "''")}'`;

const source = new Client({
  connectionString: sourceUrl,
  ssl: sourceUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});

const target = new Client({
  connectionString: targetUrl,
});

async function getTables(client) {
  const { rows } = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename;
  `);
  return rows.map((r) => r.tablename);
}

async function ensureTargetHasTables(sourceTables, targetClient) {
  const targetTables = await getTables(targetClient);
  const targetSet = new Set(targetTables);
  const missing = sourceTables.filter((t) => !targetSet.has(t));
  if (missing.length) {
    throw new Error(
      `Local DB schema tayyor emas. Avval "npx prisma db push" ni ishlating. Yetishmayotgan jadvallar: ${missing.join(", ")}`,
    );
  }
}

async function getInsertOrder(client, tables) {
  const set = new Set(tables);
  const indegree = new Map(tables.map((t) => [t, 0]));
  const edges = new Map(tables.map((t) => [t, new Set()]));

  const { rows } = await client.query(`
    SELECT
      child.relname AS child_table,
      parent.relname AS parent_table
    FROM pg_constraint fk
    JOIN pg_class child ON child.oid = fk.conrelid
    JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
    JOIN pg_class parent ON parent.oid = fk.confrelid
    JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
    WHERE fk.contype = 'f'
      AND child_ns.nspname = 'public'
      AND parent_ns.nspname = 'public';
  `);

  for (const row of rows) {
    const child = row.child_table;
    const parent = row.parent_table;
    if (!set.has(child) || !set.has(parent)) continue;
    if (!edges.get(parent).has(child)) {
      edges.get(parent).add(child);
      indegree.set(child, indegree.get(child) + 1);
    }
  }

  const queue = tables.filter((t) => indegree.get(t) === 0).sort();
  const ordered = [];

  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    const children = [...edges.get(current)].sort();
    for (const child of children) {
      indegree.set(child, indegree.get(child) - 1);
      if (indegree.get(child) === 0) queue.push(child);
    }
    queue.sort();
  }

  if (ordered.length !== tables.length) {
    const missing = tables.filter((t) => !ordered.includes(t)).sort();
    return [...ordered, ...missing];
  }

  return ordered;
}

async function getColumns(client, table) {
  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position;
    `,
    [table],
  );
  return rows.map((r) => r.column_name);
}

async function insertBatch(client, table, columns, rows, batchSize = 200) {
  if (!rows.length) return;

  const quotedColumns = columns.map(q).join(", ");

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const params = [];
    const values = batch
      .map((row, rowIndex) => {
        const placeholders = columns.map((col, colIndex) => {
          params.push(row[col]);
          return `$${rowIndex * columns.length + colIndex + 1}`;
        });
        return `(${placeholders.join(", ")})`;
      })
      .join(", ");

    const sql = `INSERT INTO ${q(table)} (${quotedColumns}) VALUES ${values};`;
    await client.query(sql, params);
  }
}

async function resetSequences(client) {
  const { rows } = await client.query(`
    SELECT
      c.relname AS table_name,
      a.attname AS column_name,
      pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) AS sequence_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval%';
  `);

  for (const row of rows) {
    const tableName = row.table_name;
    const columnName = row.column_name;
    const sequenceName = row.sequence_name;
    if (!sequenceName) continue;

    const sql = `
      SELECT setval(
        ${qs(sequenceName)}::regclass,
        GREATEST(COALESCE((SELECT MAX(${q(columnName)}) FROM ${q(tableName)}), 0) + 1, 1),
        false
      );
    `;
    await client.query(sql);
  }
}

async function main() {
  await source.connect();
  await target.connect();

  try {
    const tables = await getTables(source);
    if (!tables.length) {
      console.log("Public schema ichida copy qilinadigan jadval topilmadi.");
      return;
    }
    await ensureTargetHasTables(tables, target);

    const orderedTables = await getInsertOrder(source, tables);
    console.log(`Ko'chirish boshlanmoqda. Jadvallar soni: ${orderedTables.length}`);

    await target.query("BEGIN;");
    try {
      const truncateSql = `TRUNCATE TABLE ${orderedTables.map(q).join(", ")} RESTART IDENTITY CASCADE;`;
      await target.query(truncateSql);

      for (const table of orderedTables) {
        const columns = await getColumns(source, table);
        if (!columns.length) continue;
        const selectSql = `SELECT ${columns.map(q).join(", ")} FROM ${q(table)};`;
        const { rows } = await source.query(selectSql);
        await insertBatch(target, table, columns, rows);
        console.log(`${table}: ${rows.length} ta yozuv ko'chirildi`);
      }

      await resetSequences(target);
      await target.query("COMMIT;");
      console.log("Neon -> Local data copy muvaffaqiyatli tugadi.");
    } catch (error) {
      await target.query("ROLLBACK;");
      throw error;
    }
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((err) => {
  console.error("Data ko'chirishda xatolik:", err.message);
  process.exit(1);
});
