import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY || undefined,
  timeout: 30000
});

const COLLECTION_NAME = 'world_entities';
const VECTOR_SIZE = 1536;

export async function setupQdrantCollection(): Promise<void> {
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine'
        },
        hnsw_config: {
          m: 16,
          ef_construct: 100
        }
      });

      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'world_id',
        field_schema: { type: 'keyword', is_tenant: true }
      });

      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'entity_type',
        field_schema: 'keyword'
      });

      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'tags',
        field_schema: 'keyword'
      });

      console.log(`Qdrant collection "${COLLECTION_NAME}" created successfully`);
    } else {
      console.log(`Qdrant collection "${COLLECTION_NAME}" already exists`);
    }
  } catch (error) {
    console.error('Error setting up Qdrant collection:', error);
  }
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: {
    world_id: string;
    entity_type: string;
    entity_id: string;
    name: string;
    tags: string[];
    summary: string;
  };
}

export async function upsertVector(point: VectorPoint): Promise<void> {
  await qdrant.upsert(COLLECTION_NAME, {
    points: [point]
  });
}

export async function upsertVectors(points: VectorPoint[]): Promise<void> {
  await qdrant.upsert(COLLECTION_NAME, {
    points
  });
}

export async function searchVectors(
  worldId: string,
  queryVector: number[],
  options: {
    entityType?: string;
    limit?: number;
    scoreThreshold?: number;
    tags?: string[];
  } = {}
): Promise<any[]> {
  const { entityType, limit = 10, scoreThreshold = 0.7, tags } = options;

  const filter: any = {
    must: [
      { key: 'world_id', match: { value: worldId } }
    ]
  };

  if (entityType) {
    filter.must.push({ key: 'entity_type', match: { value: entityType } });
  }

  if (tags && tags.length > 0) {
    filter.should = tags.map(tag => ({
      key: 'tags',
      match: { value: tag }
    }));
  }

  const result = await qdrant.query(COLLECTION_NAME, {
    query: queryVector,
    filter,
    limit,
    with_payload: true,
    score_threshold: scoreThreshold
  });

  return (result as any).points || [];
}

export async function deleteVector(pointId: string): Promise<void> {
  await qdrant.delete(COLLECTION_NAME, {
    points: [pointId]
  });
}

export async function deleteVectorsByWorld(worldId: string): Promise<void> {
  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [
        { key: 'world_id', match: { value: worldId } }
      ]
    }
  });
}
