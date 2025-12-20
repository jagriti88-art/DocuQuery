'use client';

import * as React from 'react';
import { useState } from 'react';
import { Upload, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button'; 

// 1. Dynamic API Base URL
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface FileUploadProps {
  onUploadSuccess?: (fileName: string) => void;
}

const FileUploadComponent: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUploadButtonClick = () => {
    const el = document.createElement('input');
    el.type = 'file';
    el.setAttribute('accept', 'application/pdf'); 
    
    el.addEventListener('change', async (ev) => {
      if (el.files && el.files.length > 0) {
        const file = el.files[0];
        
        // Basic validation
        if (file.size > 10 * 1024 * 1024) { // 10MB Limit
           setError("File is too large (Max 10MB)");
           return;
        }

        setFileName(file.name);
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('pdf', file);

        try {
          // 2. Use the dynamic API_BASE
          const response = await fetch(`${API_BASE}/upload/pdf`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            console.log('File uploaded successfully:', file.name);
            if (onUploadSuccess) {
              onUploadSuccess(file.name);
            }
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
          }
        } catch (error: any) {
          console.error('Upload failed:', error);
          setError("Server unreachable. Ensure backend is awake.");
          setFileName(null);
        } finally {
          setIsUploading(false);
        }
      }
    });
    el.click();
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="w-full bg-slate-900/40 backdrop-blur-md text-white shadow-2xl border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 transition-all hover:border-purple-500/30"
    >
      {/* Icon State Controller */}
      <div className={`p-5 rounded-2xl transition-all duration-500 ${
        isUploading ? 'bg-blue-500/20 text-blue-400' : 
        fileName ? 'bg-emerald-500/20 text-emerald-400' : 
        'bg-purple-500/10 text-purple-400'
      }`}>
        {isUploading ? (
          <Loader2 className="h-10 w-10 animate-spin" />
        ) : fileName ? (
          <FileCheck className="h-10 w-10" />
        ) : (
          <Upload className="h-10 w-10" />
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold tracking-tight text-white">
          {isUploading ? "Analyzing PDF..." : fileName ? "Document Loaded" : "Drop your PDF"}
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          {fileName ? fileName : "Gemini will process and index the text"}
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-red-400 text-[10px] bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20"
          >
            <AlertCircle size={12} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        onClick={handleFileUploadButtonClick}
        disabled={isUploading}
        className={`w-full h-12 rounded-xl font-bold transition-all ${
          fileName 
          ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
          : "bg-purple-600 hover:bg-purple-500 text-white"
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Uploading...
          </span>
        ) : fileName ? (
          "Change Document"
        ) : (
          "Select PDF"
        )}
      </Button>

      <div className="pt-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Secure & Encrypted
        </p>
      </div>
    </motion.div>
  );
};

export default FileUploadComponent;