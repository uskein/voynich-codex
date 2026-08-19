import 'dotenv/config';
import { setupQdrantCollection } from './qdrant.service';

async function main() {
  await setupQdrantCollection();
  console.log('[qdrant] setup finished');
}

main().catch((error) => {
  console.error('[qdrant] setup failed:', error);
  process.exit(1);
});