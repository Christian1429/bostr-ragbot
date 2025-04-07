'use client';

import React, { useState } from 'react';
import {
  handleFileUpload,
  handleUrlLoad,
  handleTextLoad,
  handleMigration,
  chat,
} from '../utils/api';

function ApiComponent() {
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleChatClick = async () => {
    try {
      const result = await chat(chatQuestion);
      setChatAnswer(result.answer);
    } catch (error) {
      console.error('Error chatting:', error);
      setChatAnswer('Error chatting');
    }
  };

  const handleMigrationClick = async () => {
    try {
      const result = await handleMigration();
      setMigrationResult(JSON.stringify(result));
    } catch (error) {
      console.error('Error migrating:', error);
      setMigrationResult('Error migrating');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUploadClick = async () => {
    if (file) {
      try {
        await handleFileUpload(file, 'pdf');
        alert('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file.');
      }
    }
  };

  const handleUrlLoadClick = async () => {
    try {
      await handleUrlLoad(url, 'url');
      alert('URL loaded successfully!');
    } catch (error) {
      console.error('Error loading URL:', error);
      alert('Error loading URL.');
    }
  };

  const handleTextLoadClick = async () => {
    try {
      await handleTextLoad(text, 'text');
      alert('Text loaded successfully!');
    } catch (error) {
      console.error('Error loading text:', error);
      alert('Error loading text.');
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center text-blue-600 my-8">
        BOSTR-RAGBOT
      </h1>
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <textarea
          className="w-full h-48 border rounded-lg p-4 shadow-md resize-none focus:outline-none focus:ring focus:ring-blue-200"
          value={chatQuestion}
          onChange={(e) => setChatQuestion(e.target.value)}
          placeholder="Skriv in din fråga..."
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none focus:ring focus:ring-blue-200"
          onClick={handleChatClick}
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
      <div className="w-full border-b border-gray-300 py-4"></div>
      {/* ADMIN PANEL */}

      {/* Migrate Vectorstore */}
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-blue-600 my-8">
          Admin Panel
        </h1>
        <div className="space-y-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none focus:ring focus:ring-blue-200"
            onClick={handleMigrationClick}
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
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg shadow-md p-3"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none focus:ring focus:ring-blue-200"
          onClick={handleFileUploadClick}
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none focus:ring focus:ring-blue-200"
          onClick={handleUrlLoadClick}
        >
          Skrapa hemsida
        </button>
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition duration-300 ease-in-out focus:outline-none focus:ring focus:ring-blue-200"
          onClick={handleTextLoadClick}
        >
          Skicka text
        </button>
      </div>
    </div>
  );
}

export default ApiComponent;
