import { db } from '../utils/admin';

export async function searchDocumentsByTag(req, res) {
  try {
    const {
      tag,
      //* CHANGE THE COLLECTION NAME TO YOUR OWN
      collection = 'openai_document_embeddings',
      limit = 100,
      page = 1,
    } = req.body;

    if (!tag) {
      return res.status(400).json({ error: 'Tag parameter is required' });
    }

    const collectionRef = db.collection(collection);
    let query = collectionRef
      .where('metadata.tags', 'array-contains', tag)
      .orderBy('__name__');

    // Pagination support
    if (page > 1) {
      const snapshot = await query.limit((page - 1) * limit).get();
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(limit).get();

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
      metadata: doc.data().metadata,
    }));

    res.json({
      success: true,
      count: results.length,
      total: snapshot.size,
      page,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search documents',
      details: error.message,
    });
  }
}
