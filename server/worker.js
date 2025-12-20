import 'dotenv/config';
import { Worker } from 'bullmq';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TaskType } from "@google/generative-ai";
import fs from 'fs'; // Added to check if file exists

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: {}, // Essential for Upstash
  maxRetriesPerRequest: null,
  
  // These settings prevent ECONNRESET
  connectTimeout: 30000, 
  keepAlive: 10000, 
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) return true;
    return false;
  },
};

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    // 1. Parse Job Data
    const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
    console.log(`🚀 Starting Job ${job.id}: Processing ${data.name}`);

    // 2. Safety Check: Does the file exist?
    if (!fs.existsSync(data.path)) {
      throw new Error(`File not found at path: ${data.path}. Ensure 'uploads/' folder exists.`);
    }

    // 3. Load and Split PDF
    console.log("📄 Loading PDF...");
    const loader = new PDFLoader(data.path);
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const docs = await splitter.splitDocuments(rawDocs);

    const docsWithMetadata = docs.map(doc => {
      doc.metadata.file_id = data.name; 
      return doc;
    });

    // 4. Initialize Gemini Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 5. Store in Qdrant
    console.log(`📡 Sending ${docs.length} chunks to Qdrant...`);
    await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'pdfr-gemini',
    });

    // 6. Cleanup local file (Optional - uncomment to save space)
    // fs.unlinkSync(data.path); 

    return { status: "success", chunks: docs.length };
  },
  {
    connection,
    concurrency: 5,
    stalledInterval: 300000, 
  }
);

// --- NEW LISTENERS FOR DEBUGGING ---

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} FINISHED. PDF is now searchable.`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} FAILED: ${err.message}`);
});

worker.on('error', err => {
  console.error('🔥 Worker Error:', err);
});

console.log("🛠️ Worker is running and listening for jobs...");