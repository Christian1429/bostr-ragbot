import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFExtract } from 'pdf.js-extract';
import { PDFExtractResult } from '../lib/interfaces.js';
import { openai } from '../lib/openai.js';

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

//* Text extract from Json
export function ExtractTextFromJson(
  jsonObjects: Record<string, any>[],
): string {

  const texts: string[] = [];

  for (const obj of jsonObjects) {
    function flattenJson(
      obj: any,
      key = '',
      separator = ' '
    ): Record<string, string> {
      const items: Record<string, string> = {};
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach((v, i) => {
            const newKey = key ? `${key}${separator}${i}` : String(i);
            Object.assign(items, flattenJson(v, newKey, separator));
          });
        } else {
          for (const k in obj) {
            if (Object.hasOwnProperty.call(obj, k)) {
              const newKey = key ? `${key}${separator}${k}` : k;
              Object.assign(items, flattenJson(obj[k], newKey, separator));
            }
          }
        }
      } else if (
        typeof obj === 'string' ||
        typeof obj === 'number' ||
        typeof obj === 'boolean'
      ) {
        items[key] = String(obj);
      }
      return items;
    }

    const flattened = flattenJson(obj);
    texts.push(Object.values(flattened).join(' '));
  }

  return texts.join('\n');
}

export async function extractImageKeywords(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data, 'binary');
    const base64Image = buffer.toString('base64');

    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              //* Adjust the prompt as needed for more or less keywords, or any other specific
              text: '.Ta ut och returnera en kort lista på 5–10 nyckelord som beskriver huset och tomten bilden. Returnera endast nyckelorden, kommaseparerade. undvik att nämna bil och generella saker som himmel eller liknande.',
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const keywords = result.choices?.[0]?.message?.content?.trim() || '';
    return keywords;
  } catch (error) {
    console.error('Failed to extract keywords from image:', error);
    throw new Error('Could not process image for keyword extraction.');
  }
}