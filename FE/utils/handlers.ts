import {
  loadDocumentByType,
  handleUrlLoad,
  handleTextLoad,
  handleMigration,
  handleImageExtract,
  handleSearchByTag,
  chat,
} from './api';
import { SearchResultItem } from '../interface/interface';

export const handleChatClick = async (
  chatQuestion: string,
  setChatAnswer: (val: string) => void
) => {
  try {
    const result = await chat(chatQuestion);
    setChatAnswer(result.answer);
  } catch (error) {
    console.error('Error chatting:', error);
    setChatAnswer('Error chatting');
  }
};

export const handleFileUploadClick = async (
  file: File | null,
  tag: string
): Promise<void> => {
  if (!file) {
    alert('Välj en fil innan du försöker ladda upp!');
    return;
  }
  try {
    let fileType: 'pdf' | 'json';

    if (file.type === 'application/pdf') {
      fileType = 'pdf';
    } else if (
      file.type === 'application/json' ||
      file.name.endsWith('.json')
    ) {
      fileType = 'json';
    } else {
      alert('Only PDF and JSON files are allowed');
      return;
    }

    await loadDocumentByType(file, fileType, tag);
    alert('File uploaded successfully!');
  } catch (error) {
    console.error('Error uploading file:', error);
    alert(
      `Error uploading file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

export const handleUrlLoadClick = async (url: string, tag: string) => {
  try {
    await handleUrlLoad(url, 'url', tag);
    alert('URL loaded successfully!');
  } catch (error) {
    console.error('Error loading URL:', error);
    alert('Error loading URL.');
  }
};

export const handleSearchClick = async (
  setSearchResult: React.Dispatch<React.SetStateAction<SearchResultItem[]>>,
  searchTag: string
): Promise<void> => {
  try {
    const results = await handleSearchByTag(searchTag);
    setSearchResult(results);
    console.log('Search completed!');
    if (results.length === 0) {
      alert('Inga dokument hittades med detta tagg.');
    }
  } catch (error) {
    console.error('Error searching:', error);
    alert('Error searching.');
  }
};
  
export const handleMigrationClick = async (
  setMigrationResult: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> => {
  try {
    const result = await handleMigration();
    setMigrationResult(JSON.stringify(result));
  } catch (error) {
    console.error('Error migrating:', error);
    setMigrationResult('Error migrating');
  }
};

  export const handleTextLoadClick = async (text: string, tag: string) => {
    try {
      await handleTextLoad(text, 'text', tag);
      alert('Text loaded successfully!');
    } catch (error) {
      console.error('Error loading text:', error);
      alert('Error loading text.');
    }
  };

  export const handleImageExtractClick = async (
    imageUrl: string,
    setImageKeys: React.Dispatch<React.SetStateAction<string>>
  ): Promise<void> => {
    try {
      const keywords = await handleImageExtract(imageUrl);
      setImageKeys(keywords);
      alert('Image extracted successfully!');
      console.log(keywords);
    } catch (error) {
      console.error('Error extracting image:', error);
      alert('Error extracting image.');
    }
  };

  export const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ): void => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
