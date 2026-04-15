import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL ?? '';
    const ssl = PrismaService.resolveSsl(connectionString);

    const pool = new Pool({
      connectionString,
      ssl,
      max: Number(process.env.DB_POOL_MAX ?? 20),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 30000),
      connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT_MS ?? 10000),
    });
    super({
      adapter: new PrismaPg(pool),
      transactionOptions: {
        maxWait: Number(process.env.PRISMA_TX_MAX_WAIT_MS ?? 15000),
        timeout: Number(process.env.PRISMA_TX_TIMEOUT_MS ?? 30000),
      },
    });
  }

  private static resolveSsl(connectionString: string) {
    const forced = (process.env.DB_SSL ?? '').trim().toLowerCase();
    if (forced === 'true' || forced === '1') {
      return { rejectUnauthorized: false };
    }
    if (forced === 'false' || forced === '0') {
      return false;
    }

    try {
      const url = new URL(connectionString);
      const host = (url.hostname ?? '').toLowerCase();
      const sslMode = (url.searchParams.get('sslmode') ?? '').toLowerCase();

      if (sslMode === 'disable') return false;
      if (sslMode && sslMode !== 'disable') return { rejectUnauthorized: false };
      if (host === 'localhost' || host === '127.0.0.1') return false;
      if (host.endsWith('.neon.tech')) return { rejectUnauthorized: false };
    } catch {
      // Fallback below when URL parse fails
    }

    return { rejectUnauthorized: false };
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
