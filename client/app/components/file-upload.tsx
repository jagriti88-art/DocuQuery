'use client';

import * as React from 'react';
import { useState } from 'react';
import { Upload, FileCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button'; 

// 1. Define the Prop interface
interface FileUploadProps {
  onUploadSuccess?: (fileName: string) => void;
}

const FileUploadComponent: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUploadButtonClick = () => {
    const el = document.createElement('input');
    el.type = 'file';
    el.setAttribute('accept', 'application/pdf'); 
    
    el.addEventListener('change', async (ev) => {
      if (el.files && el.files.length > 0) {
        const file = el.files[0];
        setFileName(file.name);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('pdf', file);

        try {
          const response = await fetch('http://localhost:8000/upload/pdf', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            console.log('File uploaded successfully:', file.name);
            // 2. Call the prop function to update the global state
            if (onUploadSuccess) {
              onUploadSuccess(file.name);
            }
          }
        } catch (error) {
          console.error('Upload failed:', error);
        } finally {
          setIsUploading(false);
        }
      }
    });
    el.click();
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="w-full bg-slate-900/80 backdrop-blur-sm text-white shadow-xl border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 transition-all hover:border-purple-500/50"
    >
      <div className="p-4 rounded-full bg-purple-500/10 text-purple-400">
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : fileName ? (
          <FileCheck className="h-8 w-8 text-green-400" />
        ) : (
          <Upload className="h-8 w-8" />
        )}
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-100">
          {fileName ? "File Ready" : "Upload Document"}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px] truncate">
          {fileName ? fileName : "PDF files only for analysis"}
        </p>
      </div>

      <Button 
        onClick={handleFileUploadButtonClick}
        disabled={isUploading}
        variant="outline"
        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white"
      >
        {isUploading ? "Processing..." : "Select File"}
      </Button>
    </motion.div>
  );
};

export default FileUploadComponent;