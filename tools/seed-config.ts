/**
 * Seed the default game configuration document.
 *
 * Idempotent — running this twice does not create duplicates and does not
 * overwrite tenant-customised values. Intended for local bootstrap and
 * for the initial Cloud Run revision.
 *
 * Usage:
 *   npm run seed:config              # seeds the "default" tenant
 *   TENANT_ID=corp npm run seed:config
 */
import mongoose from 'mongoose';
import { DEFAULT_GAME_CONFIG } from '../libs/shared/game-engine/src/lib/default-config';

const TENANT_ID = process.env['TENANT_ID']?.trim() || 'default';
const MONGODB_URI =
  process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/hand-betting-game';

async function main() {
  await mongoose.connect(MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log(`Connected to ${MONGODB_URI}`);

  const collection = mongoose.connection.collection('game_configs');

  // $setOnInsert means re-running is safe — existing tenant settings stay put.
  const result = await collection.findOneAndUpdate(
    { tenantId: TENANT_ID },
    {
      $setOnInsert: {
        tenantId: TENANT_ID,
        ...DEFAULT_GAME_CONFIG,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  // eslint-disable-next-line no-console
  console.log(`Seeded game_configs row for tenant "${TENANT_ID}":`);
  // eslint-disable-next-line no-console
  console.log(result);

  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
