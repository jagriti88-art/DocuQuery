"use client";

import * as React from 'react'; // Added React import for useState
import { motion } from "framer-motion";
import FileUploadComponent from './components/file-upload'; 
import ChatComponent from './components/chat';

export default function Home() {
  // 1. Create a state to hold the name of the active file
  const [activeFile, setActiveFile] = React.useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      
      {/* 1. Sidebar / Upload Section */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-[30vw] min-w-[300px] h-full flex flex-col items-center p-8 bg-slate-900/50 backdrop-blur-xl border-r border-white/10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Upload PDF
          </h2>
          <p className="text-sm text-slate-400 mt-2">Add a document to start the conversation</p>
        </div>
        
        <div className="w-full">
          {/* 2. When upload succeeds, we update our activeFile state */}
          <FileUploadComponent onUploadSuccess={(fileName) => setActiveFile(fileName)} />
          
          {/* Visual indicator of the current file in the sidebar */}
          {activeFile && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center"
            >
              <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Currently Analyzing</p>
              <p className="text-sm text-slate-200 truncate font-medium mt-1">{activeFile}</p>
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* 2. Chat Section */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 h-full flex flex-col relative bg-transparent"
      >
        {/* 3. Pass the activeFile to the Chat component as a prop */}
        <ChatComponent fileName={activeFile} />
      </motion.main>
      
    </div>
  );
}