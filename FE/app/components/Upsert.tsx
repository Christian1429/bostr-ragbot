// 'use client';

// import { useState } from 'react';

// export default function VectorUpsertForm() {
//   const [collectionName, setCollectionName] = useState('');
//   const [vectorId, setVectorId] = useState('');
//   const [embeddingStr, setEmbeddingStr] = useState('');
//   const [loading, setLoading] = useState(false);
  // const [upsertVector, setUpsertVector] = useState<any>();
  
  
  // const handleUpsert = async () => {
  //   try {
  //     const embedding = embeddingStr
  //       .split(',')
  //       .map((v: string) => parseFloat(v.trim()))
  //       .filter((n: number) => !isNaN(n));

  //     if (!collectionName || !vectorId || embedding.length === 0) {
  //       console.log('Please fill in all fields with valid data.');
  //       return;
  //     }

  //     setLoading(true);

  //     await upsertVector(collectionName, vectorId, {
  //       embedding,
  //       updatedAt: new Date(),
  //     });

  //     console.log('Vector upserted successfully!');
  //     setEmbeddingStr('');
  //   } catch (error) {
  //     console.error('Upsert failed:', error);
  //     console.log('Something went wrong.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  
//   return (
//     <div className="p-4 max-w-md mx-auto space-y-4">
//       <input
//         type="text"
//         placeholder="Collection Name"
//         value={collectionName}
//         onChange={(e) => setCollectionName(e.target.value)}
//         className="w-full p-2 border rounded"
//       />
//       <input
//         type="text"
//         placeholder="Vector ID"
//         value={vectorId}
//         onChange={(e) => setVectorId(e.target.value)}
//         className="w-full p-2 border rounded"
//       />
//       <textarea
//         placeholder="Embedding (comma-separated)"
//         value={embeddingStr}
//         onChange={(e) => setEmbeddingStr(e.target.value)}
//         className="w-full p-2 border rounded h-24"
//       />
//       <button
//         onClick={handleUpsert}
//         disabled={loading}
//         className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
//       >
//         {loading ? 'Upserting...' : 'Upsert Vector'}
//       </button>
//     </div>
//   );
// }
