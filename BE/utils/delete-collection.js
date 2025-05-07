// import admin from 'firebase-admin';
// import serviceAccount from '../adminConfig.json' assert { type: 'json' }

// //! USE TAG DELETE IF YOU DONT WANT TO REMOVE EVERYTHING, THIS DELETES THE WHOLE COLLECTION.
// //! RUN THIS USING WITH NODE COMMAND NO BUTTON WILL BE ADDED FOR THIS IN CMS. 

// //! Deletes whole collection
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// async function deleteCollection(collectionPath, batchSize) {
//   const db = admin.firestore();
//   const collectionRef = db.collection(collectionPath);
//   const query = collectionRef.orderBy('__name__').limit(batchSize);

//   return new Promise((resolve, reject) => {
//     deleteQueryBatch(db, query, batchSize, resolve, reject);
//   });
// }

// async function deleteQueryBatch(db, query, batchSize, resolve, reject) {
//   const snapshot = await query.get();

//   if (snapshot.size === 0) {
//     resolve();
//     return;
//   }

//   // Delete documents in a batch
//   const batch = db.batch();
//   snapshot.docs.forEach((doc) => {
//     batch.delete(doc.ref);
//   });

//   try {
//     await batch.commit();
//   } catch (error) {
//     reject(error);
//   }

//   // Recurse on the next process tick, to avoid
//   // exploding the event loop.
//   process.nextTick(() => {
//     deleteQueryBatch(db, query, batchSize, resolve, reject);
//   });
// }

// const collectionName = 'openai_document_embeddings'; //! Change to current collection name
// const batchSize = 1;

// deleteCollection(collectionName, batchSize)
//   .then(() => {
//     console.log(`Successfully deleted collection: ${collectionName}`);
//   })
//   .catch((error) => {
//     console.error('Error deleting collection:', error);
//   });
