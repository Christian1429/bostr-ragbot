'use client';

import React, { useState } from 'react';
import { DeleteByTag } from './components/DeleteTags';
import { SearchResultItem } from '../interface/interface';
import {
  handleChatClick,
  handleFileUploadClick,
  handleUrlLoadClick,
  handleSearchClick,
  handleMigrationClick,
  handleTextLoadClick,
  handleImageExtractClick,
  handleFileChange,
} from '../utils/handlers';

function RagComponent() {
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageKeys, setImageKeys] = useState('');
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResultItem[]>([]);

  return (
    <div>
      <div
        style={{
          backgroundImage: 'var(--bostr-logo-url)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '160px',
          height: '80px',
          margin: '0 auto',
          marginTop: '20px',
        }}
      >
        <span className="sr-only">BOSTR Logo</span>
      </div>
      <h1 className="text-1xl font-bold text-center text-white-600 my-4">
        Retrieval-Augmented Generation
      </h1>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <textarea
          className="w-full h-48 border rounded-lg p-4 shadow-md resize-none focus:outline-none focus:ring focus:ring-white-200"
          value={chatQuestion}
          onChange={(e) => setChatQuestion(e.target.value)}
          placeholder="Skriv in din fråga..."
        />
        <button
          className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
          onClick={() => handleChatClick(chatQuestion, setChatAnswer)}
        >
          Skicka
        </button>
        {chatAnswer && (
          <div className="mt-4 p-4 rounded-md bg-gray-100">
            <p className="font-semibold text-black">Svar:</p>
            <p className="text-black">{chatAnswer}</p>
          </div>
        )}
      </div>
      <div className="w-full border-b border-[#51D4A0] py-4"></div>

      {/* ADMIN PANEL */}

      {/* Migrate Vectorstore */}
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <h1 className="text-1xl font-extrabold text-center text-white-600 my-8">
          Admin Panel
        </h1>
        {/* Tag input */}
        <h4 className="text-center text-white-600 my-8">
          Ange META tagg för dina dokument
        </h4>
        <input
          type="text"
          className="w-full border rounded-lg p-4 shadow-md focus:outline-none focus:ring focus:ring-blue-200"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="META tagg tex: SKATT2025"
        />
        <div
          style={{
            backgroundImage: 'var(--arrow-logo-url)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            width: '50px',
            height: '85px',
            margin: '0 auto',
            marginTop: '20px',
            color: 'white',
            backgroundColor: '#4C2040',
          }}
        ></div>
        <div className="space-y-4">
          <button
            className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
            onClick={() => handleMigrationClick(setMigrationResult)}
          >
            Migrera Vectorstore
          </button>
          {migrationResult && (
            <div className="mt-4 p-4 rounded-md bg-gray-100">
              <p className="font-semibold">Migration Result:</p>
              <p>{migrationResult}</p>
            </div>
          )}
        </div>
      </div>
      {/* File Upload */}
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <input
          type="file"
          onChange={(e) => handleFileChange(e, setFile)}
          className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#4C2040] hover:file:bg-blue-100 border border-white-300 rounded-lg shadow-md p-3"
        />
        <button
          className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
          onClick={() => handleFileUploadClick(file, tag)}
        >
          Ladda upp fil
        </button>
      </div>

      {/* URL Load */}
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <input
          className="w-full border rounded-lg p-4 shadow-md focus:outline-none focus:ring focus:ring-blue-200"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Lägg in URL..."
        />
        <button
          className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
          onClick={() => handleUrlLoadClick(url, tag)}
        >
          Skrapa hemsida
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <input
          className="w-full border rounded-lg p-4 shadow-md focus:outline-none focus:ring focus:ring-blue-200"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Lägg in URL..."
        />
        <button
          className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
          onClick={() => handleImageExtractClick(imageUrl, setImageKeys)}
        >
          Extrahera nyckelord från bild
        </button>

        {imageKeys && (
          <div className="mt-4 p-4 rounded-md bg-gray-100">
            <p className="font-semibold text-black">Nyckelord från bilden:</p>
            <p className="text-black">{imageKeys}</p>
          </div>
        )}
      </div>
      {/* Text Load */}
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <textarea
          className="w-full h-48 border rounded-lg p-4 shadow-md resize-none focus:outline-none focus:ring focus:ring-blue-200"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv text..."
        />
        <button
          className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
          onClick={() => handleTextLoadClick(text, tag)}
        >
          Skicka text
        </button>
      </div>
      <div className="w-full border-b border-[#51D4A0] py-4"></div>
      <DeleteByTag />

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <textarea
          className="w-full border rounded-lg p-4 shadow-md focus:outline-none focus:ring focus:ring-blue-200"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          placeholder="Skriv text..."
        />
        <button
          className="bg-[#4C2040] hover:text-[#4C2040] hover:bg-white border-white text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none border border-white-300 rounded-lg shadow-md p-3"
          onClick={() => handleSearchClick(setSearchResult, searchTag)}
        >
          Sök efter tagg
        </button>
        {searchResult.length > 0 && (
          <div>
            {searchResult.map((result) => (
              <div key={result.id} style={{ marginBottom: 20 }}>
                <p>
                  <strong>ID:</strong> {result.id}
                </p>
                <p>
                  <strong>Skapad:</strong> {result.data.created}
                </p>
                <p>
                  <strong>Content:</strong> {result.data.content}
                </p>
                <p>
                  <strong>Tags:</strong> {result.metadata.tags.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RagComponent;
