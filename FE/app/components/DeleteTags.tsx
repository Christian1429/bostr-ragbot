import React, { useState } from 'react';
import { deleteDocumentsByTag } from '../../utils/api';

export const DeleteByTag = () => {
  const [tag, setTag] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!tag.trim()) {
      setError('Please enter a tag');
      return;
    }

    setIsDeleting(true);
    setError('');
    setMessage('');

    try {
      const result = await deleteDocumentsByTag({
        tag,
        // collection: 'optional_collection_name',
        // batchSize: 50
      });
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
<div className="p-6 space-y-6 max-w-lg mx-auto">
  <h1 className="text-1xl font-extrabold text-center text-white-600 my-8">
    Ta bort dokument baserat på tags: [ din tagg ]
  </h1>
  <input
    type="text"
    className="w-full border rounded-lg p-4 shadow-md focus:outline-none focus:ring focus:ring-blue-200"
    value={tag}
    onChange={(e) => setTag(e.target.value)}
    placeholder="Ange tagg du vill ta bort..."
  />
  
  <div className="space-y-4">
    <button
      className={`bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3 ${
        isDeleting || !tag.trim() ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={handleDelete}
      disabled={isDeleting || !tag.trim()}
    >
      {isDeleting ? 'Tar bort...' : 'Ta bort dokument'}
    </button>
    
    {message && (
      <div className="mt-4 p-4 rounded-md bg-green-100 border border-green-200">
        <p className="font-semibold text-green-800">Success:</p>
        <p className="text-green-600">{message}</p>
      </div>
    )}
    
    {error && (
      <div className="mt-4 p-4 rounded-md bg-red-100 border border-red-200">
        <p className="font-semibold text-red-800">Error:</p>
        <p className="text-red-600">{error}</p>
      </div>
    )}
  </div>
</div>
)}

export default DeleteByTag;
