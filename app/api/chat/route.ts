import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore } from '../../../server';
import { createPromptTemplate, generateResponse } from '../../../server';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    console.log(`Processing question: "${question}"`);

    // Get vectorStore
    const store = await getVectorStore();

    // Get relevant documents
    console.log('Searching for relevant documents...');
    const retriever = store.asRetriever(6);
    const relevantDocs = await retriever.getRelevantDocuments(question);

    console.log(`Found ${relevantDocs.length} relevant documents`);

    // Create context from relevant documents
    const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

    if (!context.trim()) {
      console.log('No relevant context found');
      return NextResponse.json({ answer: 'No relevant information found in available documents.' });
    }

    console.log('Generating response...');
    const formattedPrompt = await createPromptTemplate(context, question);
    const response = await generateResponse(formattedPrompt);

    console.log('Response generated');
    return NextResponse.json({ answer: response });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
