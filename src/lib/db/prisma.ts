import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Prisma Client Singleton.
 * Uses globalThis to prevent multiple instances during development reloads.
 * If running in a client-only browser bundle, returns null safely.
 */
export function getPrismaClient(): PrismaClient | null {
  if (typeof window !== 'undefined') {
    // Running in browser client
    return null;
  }

  try {
    if (!global.prismaGlobal) {
      global.prismaGlobal = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    }
    return global.prismaGlobal;
  } catch (error) {
    console.warn('PrismaClient could not be initialized in this environment:', error);
    return null;
  }
}

export const prisma = getPrismaClient();
