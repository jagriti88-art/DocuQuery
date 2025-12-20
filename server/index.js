import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { ChatOpenAI } from "@langchain/openai"; 
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from '@qdrant/js-client-rest';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://docu-query-peach.vercel.app',
    'https://docu-query-git-main-jagriti-dwivedis-projects.vercel.app',
    'https://docu-query-as13pzr5u-jagriti-dwivedis-projects.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

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

const fileQueue = new Queue('file-upload-queue', { connection });
const upload = multer({ dest: '/tmp' }); 

// AI Initializations
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY,
});

const model = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  configuration: { baseURL: "https://api.groq.com/openai/v1" },
  modelName: "llama-3.3-70b-versatile",
});

// --- ROUTES ---

app.get('/ping', (req, res) => {
  return res.json({ status: "ok", message: "Express is alive!" });
});

// UPDATED: Now returns jobId for polling
app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    
    const job = await fileQueue.add('process-pdf', { 
      path: req.file.path, 
      name: req.file.originalname 
    });
    
    // Send back the jobId so frontend can check status
    return res.status(200).json({ 
      message: "File queued!", 
      jobId: job.id 
    });
  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// NEW: Job Status route
app.get('/job-status/:id', async (req, res) => {
  try {
    const job = await fileQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState(); // waiting, active, completed, failed
    return res.json({ id: job.id, state });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/chat', async (req, res) => {
  try {
    const { message, fileName } = req.query; 
    if (!message) return res.status(400).send("Missing message");

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'pdfr-gemini',
    });

    const retriever = vectorStore.asRetriever({
      k: 3,
      filter: fileName ? {
        must: [{ key: "metadata.file_id", match: { value: fileName } }]
      } : undefined
    });

    const contextDocs = await retriever.invoke(message);

    if (contextDocs.length === 0) {
      return res.status(200).json({ 
        answer: "I couldn't find any relevant info in the document.", 
        sources: [] 
      });
    }

    const fullPrompt = `Answer based ONLY on context:
    Context: ${contextDocs.map(d => d.pageContent).join("\n\n")}
    Question: ${message}`;

    const aiResponse = await model.invoke(fullPrompt);
    const safeAnswer = String(aiResponse.content);
    const safeSources = contextDocs.map(d => ({
      content: d.pageContent.substring(0, 300),
      page: d.metadata?.loc?.pageNumber || 1
    }));

    return res.status(200).json({ answer: safeAnswer, sources: safeSources });

  } catch (error) {
    console.error("Chat Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Chat failed" });
    }
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on PORT:${PORT}`);
});

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function createPayloadIndex() {
  try {
    await client.createPayloadIndex('pdfr-gemini', {
      field_name: 'metadata.file_id',
      field_schema: 'keyword',
    });
  } catch (err) {
    console.log("Index status:", err.message);
  }
}
createPayloadIndex();