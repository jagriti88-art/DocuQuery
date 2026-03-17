import 'dotenv/config';
import { Worker } from 'bullmq';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TaskType } from "@google/generative-ai";
import fs from 'fs';

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: {}, 
  maxRetriesPerRequest: null,
};

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
    console.log(`🚀 Starting Job ${job.id}: Processing ${data.name}`);

    if (!fs.existsSync(data.path)) {
      throw new Error(`File not found at path: ${data.path}`);
    }

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

    // --- 2026 STABLE CONFIGURATION ---
    const embeddings = new GoogleGenerativeAIEmbeddings({
      // Using the latest stable 2026 model
      model: "gemini-embedding-2-preview", 
      apiKey: process.env.GOOGLE_API_KEY,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      // We explicitly set the dimensions to match your Qdrant collection
      outputDimensionality: 3072, 
    });

    console.log(`📡 Sending ${docs.length} chunks to Qdrant...`);
    
    try {
      await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: 'pdfr-gemini',
        checkCompatibility: false,
      });
    } catch (qdrantErr) {
      console.error("❌ Qdrant Storage Error:", qdrantErr.message);
      throw qdrantErr;
    }

    return { status: "success", chunks: docs.length };
  },
  {
    connection,
    concurrency: 5,
  }
);

// Success/Failure Listeners
worker.on('completed', (job) => console.log(`✅ Job ${job.id} FINISHED. Document is live.`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} FAILED: ${err.message}`));

console.log("🛠️ Worker is running and listening for jobs...");