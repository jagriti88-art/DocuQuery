Demo:



https://github.com/user-attachments/assets/b3650337-ff49-4b07-a2ea-4698b6376091



snippets: <img width="1851" height="919" alt="Screenshot 2026-03-18 031916" src="https://github.com/user-attachments/assets/52b2a320-706e-42d1-a866-a2a11ccc61d6" />


<img width="1390" height="919" alt="Screenshot 2026-03-18 031933" src="https://github.com/user-attachments/assets/991111ef-a3c4-42fe-a251-4c62c3ddfec3" />
<img width="1861" height="911" alt="Screenshot 2026-03-18 032020" src="https://github.com/user-attachments/assets/48d8d931-4b9c-4a2e-b4c7-b59b50cdfb98" />

# 🚀 DocuQuery AI

DocuQuery is a high-performance **RAG (Retrieval-Augmented Generation)** platform that allows users to upload PDF documents and have intelligent, context-aware conversations with them. 

Built with a modern stack focusing on millisecond retrieval and high-fidelity AI reasoning.

---

## 🛠️ The Tech Stack

### Frontend
* **Framework:** Next.js 15 (App Router)
* **Auth:** Clerk (Multi-tenant)
* **Styling:** Tailwind CSS v4 + Framer Motion
* **Icons:** Lucide React

### Backend
* **Engine:** FastAPI (Python) / Node.js Express
* **LLM:** Google Gemini 1.5 Flash
* **Vector DB:** Qdrant (Cloud)
* **Orchestration:** LangChain
* **Caching:** Redis (Keep-alive connections)

---

## ✨ Key Features

* **Strict Document Isolation:** Uses Qdrant Metadata Filtering to ensure chats never mix data from different uploads.
* **Payload Indexing:** Optimized keyword search for instant document retrieval.
* **Glassmorphic UI:** A beautiful, dark-themed dashboard with real-time upload feedback.
* **Hybrid Layout:** A high-conversion landing page for guests and a secure dashboard for authenticated users.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/docuquery.git](https://github.com/your-username/docuquery.git)
cd docuquery
2. Environment Setup
Frontend (/app/.env.local):

Code snippet

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
Backend (/server/.env):

Code snippet

QDRANT_URL=[https://your-qdrant-cluster.io](https://your-qdrant-cluster.io)
QDRANT_API_KEY=your_key
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
REDIS_URL=your_redis_url
3. Installation
Install Frontend:

Bash

npm install
npm run dev
Install Backend:

Bash

cd server
pip install -r requirements.txt
python main.py
