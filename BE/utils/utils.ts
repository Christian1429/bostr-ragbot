import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFExtract } from 'pdf.js-extract';
import { PDFExtractResult } from '../lib/interfaces.js';

const pdfExtract = new PDFExtract();

 //* Fetch content from URL
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Remove irrelevant content
    $('script').remove();
    $('style').remove();
    $('nav').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();

    return text;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error(
      `Failed to fetch content from URL: ${(error as Error).message}`
    );
  }
}

//*Extract text from PDF
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const options = {};
    const data = (await pdfExtract.extractBuffer(
      buffer,
      options
    )) as PDFExtractResult;

    const text = data.pages
      .map((page) => page.content.map((item) => item.str).join(' '))
      .join('\n');

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(
      'Kunde inte läsa PDF-filen. Kontrollera att filen är giltig.'
    );
  }
}