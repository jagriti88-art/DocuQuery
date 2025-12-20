import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { ChatOpenAI } from "@langchain/openai"; 
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";

const app = express();
app.use(cors());
app.use(express.json());

// 1. Setup Redis Queue with mandatory BullMQ fixes & Keep-Alives
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: {}, 
  maxRetriesPerRequest: null,
  connectTimeout: 30000, 
  keepAlive: 10000,      
};

const fileQueue = new Queue('file-upload-queue', { connection });
const upload = multer({ dest: 'uploads/' });

// 2. AI Initializations
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

// Health Check
app.get('/ping', (req, res) => {
  return res.json({ status: "ok", message: "Express is alive!" });
});

// PDF Upload Route
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

// Chat / RAG Route
app.get('/chat', async (req, res) => {
  try {
    const { message, fileName } = req.query; 
    if (!message) return res.status(400).send("Missing query parameter: message");

    console.log(`\n--- New Chat Request ---`);
    console.log(`🔍 Query: "${message}" | File: ${fileName || 'Searching All'}`);

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'pdfr-gemini',
    });

    // Structure the filter for LangChain's Qdrant Retriever
    const retriever = vectorStore.asRetriever({
      k: 3,
      filter: fileName ? {
        must: [{ key: "metadata.file_id", match: { value: fileName } }]
      } : undefined
    });

    const contextDocs = await retriever.invoke(message);
    console.log(`📄 Found ${contextDocs.length} relevant chunks.`);

    if (contextDocs.length === 0) {
      return res.status(200).json({ 
        answer: "I couldn't find any relevant info in the document.", 
        sources: [] 
      });
    }

    const fullPrompt = `Answer the question based ONLY on the context provided.
    Context:
    ${contextDocs.map(d => d.pageContent).join("\n\n")}

    Question: ${message}`;

    console.log("🤖 Sending to Groq...");
    const aiResponse = await model.invoke(fullPrompt);
    console.log("✅ Groq Responded!");

    // DATA CLEANING: Ensure we only send pure text to avoid circular reference errors
    const safeAnswer = String(aiResponse.content);
    const safeSources = contextDocs.map(d => ({
      content: d.pageContent.substring(0, 300),
      page: d.metadata?.loc?.pageNumber || 1
    }));

    const payload = JSON.stringify({ 
      answer: safeAnswer, 
      sources: safeSources 
    });

    console.log("📤 FORCING RESPONSE TO CLIENT...");
    
    // Explicitly set headers and use .send() for reliability
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(payload);

  } catch (error) {
    console.error("Chat Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Chat failed: " + error.message });
    }
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on PORT:${PORT}`));
// Add this temporary script to create the index
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function createPayloadIndex() {
  try {
    console.log("🛠️ Creating Payload Index for metadata.file_id...");
    await client.createPayloadIndex('pdfr-gemini', {
      field_name: 'metadata.file_id',
      field_schema: 'keyword', // This tells Qdrant to treat it as a searchable string
    });
    console.log("✅ Payload Index Created Successfully!");
  } catch (err) {
    console.log("⚠️ Index might already exist or error occurred:", err.message);
  }
}

// Run it immediately on server start
createPayloadIndex();