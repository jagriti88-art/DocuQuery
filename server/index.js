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

// --- EDIT #1: PRODUCTION CORS ---
// --- EDIT #1: PRODUCTION CORS ---
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

// --- EDIT #2: REDIS CONNECTION FIX ---
// Added checks for external Redis (like Upstash or Aiven)
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Use TLS for production Redis providers (Upstash requires this)
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined, 
  maxRetriesPerRequest: null,
  connectTimeout: 30000, 
  keepAlive: 10000,      
};

const fileQueue = new Queue('file-upload-queue', { connection });
const upload = multer({ dest: '/tmp' }); // Use /tmp for serverless/container compatibility

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

// Health Check (Keeps Render awake)
app.get('/ping', (req, res) => {
  return res.json({ status: "ok", message: "Express is alive!" });
});

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    
    await fileQueue.add('process-pdf', { 
      path: req.file.path, 
      name: req.file.originalname 
    });
    
    return res.status(200).json({ message: "File queued for processing!" });
  } catch (err) {
    console.error("Upload Error:", err);
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

// --- EDIT #3: BIND TO 0.0.0.0 ---
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on PORT:${PORT}`);
});

// Payload Indexing (Qdrant Client)
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