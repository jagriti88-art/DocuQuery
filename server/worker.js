import 'dotenv/config';
import { Worker } from 'bullmq';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// USE THIS INSTEAD
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TaskType } from "@google/generative-ai";

// 1. Upstash Redis Connection
// Replace your existing connection object with this:
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: {}, 
  maxRetriesPerRequest: null, // Still mandatory for BullMQ
  
  // ADD THESE NEW SETTINGS:
  connectTimeout: 30000, // 30 seconds
  keepAlive: 10000,      // Send a pulse every 10 seconds
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    console.log(`Processing Job: ${job.id} for file: ${job.data.name}`);
    
    const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;

    // 2. Load and Split PDF
    const loader = new PDFLoader(data.path);
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const docs = await splitter.splitDocuments(rawDocs);

    // ✅ ADDING FILE_ID TO METADATA MANUALLY
    // This ensures every chunk is tagged for your "Multitenancy" search
    const docsWithMetadata = docs.map(doc => {
      doc.metadata.file_id = job.data.name; 
      return doc;
    });

    // 3. Initialize Gemini Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      apiKey: process.env.GOOGLE_API_KEY,
    });
    
    
console.log("Connecting to Qdrant at:", process.env.QDRANT_URL);

    // 4. Store in Qdrant Cloud
    await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'pdfr-gemini',
    });

    console.log(`✅ Success: ${docs.length} chunks added to Qdrant Cloud.`);
  },
  {
    connection,
    concurrency: 5,
    stalledInterval: 300000, 
  }
);

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

console.log("🛠️ Worker is running and listening for jobs...");