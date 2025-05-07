import { db } from '../utils/admin';

export async function deleteDocumentsByTag(req, res) {
  try {
    const {
      tag,
      collection = 'openai_document_embeddings',
      batchSize = 100,
    } = req.body;

    if (!tag) {
      return res.status(400).json({ error: 'Tag parameter is required' });
    }

    const collectionRef = db.collection(collection);
    const query = collectionRef
      .where('metadata.tags', 'array-contains', tag)
      .orderBy('__name__')
      .limit(batchSize);

    await deleteQueryBatch(db, query);

    res.json({
      success: true,
      message: `Deleted all documents with tag: ${tag}`,
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete documents' });
  }
}

async function deleteQueryBatch(db, query) {
  const snapshot = await query.get();
  if (snapshot.size === 0) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted ${snapshot.size} documents`);

  // Process next batch on next tick
  await new Promise((resolve) =>
    process.nextTick(async () => {
      await deleteQueryBatch(db, query);
      resolve();
    })
  );
}
