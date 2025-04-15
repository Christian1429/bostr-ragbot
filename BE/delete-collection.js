import admin from 'firebase-admin';


// Initialize Firebase Admin SDK (replace with your service account)
//! import serviceAccount from 'dummy.json' assert { type: 'json' };


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function deleteCollection(collectionPath, batchSize) {
  const db = admin.firestore();
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

async function deleteQueryBatch(db, query, batchSize, resolve, reject) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  try {
    await batch.commit();
  } catch (error) {
    reject(error);
  }

  // Recurse on the next process tick, to avoid
  // exploding the event loop.
  process.nextTick(() => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

const collectionName = 'openai_document_embeddings'; //! Change to your collection name
const batchSize = 1;

deleteCollection(collectionName, batchSize)
  .then(() => {
    console.log(`Successfully deleted collection: ${collectionName}`);
  })
  .catch((error) => {
    console.error('Error deleting collection:', error);
  });
