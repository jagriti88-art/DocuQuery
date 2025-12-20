"use client";

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignUpButton, UserButton } from '@clerk/nextjs';
import { motion } from "framer-motion";
import { FileText, Sparkles, ShieldCheck, Zap, ArrowRight, Github } from "lucide-react";
import React from 'react'; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white selection:bg-purple-500/30`}>
          
          {/* Global Background Effect - Ensure -z-10 to stay behind everything */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-900/20 blur-[140px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-900/20 blur-[140px] animate-pulse" />
          </div>

          {/* LANDING PAGE (Signed Out) */}
          <SignedOut>
            <div className="relative z-10 min-h-screen flex flex-col overflow-x-hidden">
              {/* Simple Landing Nav */}
              <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full relative z-20">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">Q</div>
                  <span>DocuQuery</span>
                </div>
                <div className="flex items-center gap-6">
                  <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github size={20} /></a>
                  <SignUpButton mode="modal">
                    <button className="text-sm font-medium px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                      Sign In
                    </button>
                  </SignUpButton>
                </div>
              </nav>

              <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-20">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-4xl space-y-10"
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-xs font-medium text-purple-300 uppercase tracking-widest mx-auto">
                    <Sparkles size={12} /> <span>Next-Gen RAG Architecture</span>
                  </div>

                  {/* Hero Title */}
                  <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.1]">
                    Stop scrolling. <br />
                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                      Start building.
                    </span>
                  </h1>
                  
                  <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                    Upload your technical documents and build instant knowledge bases. 
                    Powered by Gemini 1.5 & Qdrant for millisecond retrieval.
                  </p>

                  {/* CALL TO ACTION / BUILD BUTTON */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <SignUpButton mode="modal">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl transition-all overflow-hidden cursor-pointer"
                      >
                        <span className="flex items-center gap-2 relative z-10">
                          Start Building Now <ArrowRight size={18} />
                        </span>
                      </motion.button>
                    </SignUpButton>
                    
                    <button className="px-8 py-4 bg-slate-900 border border-white/10 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all cursor-pointer">
                      View Documentation
                    </button>
                  </div>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
                    {[
                      { icon: <Zap className="text-yellow-400" />, title: "Hyper-Fast", desc: "Vector indexing in seconds" },
                      { icon: <ShieldCheck className="text-emerald-400" />, title: "Secure", desc: "Isolated metadata filtering" },
                      { icon: <FileText className="text-blue-400" />, title: "Context Aware", desc: "Gemini-powered reasoning" }
                    ].map((feature, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="p-6 rounded-3xl border border-white/5 bg-white/5 text-left backdrop-blur-sm hover:border-white/10 transition-colors"
                      >
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="font-bold text-lg">{feature.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </main>

              <footer className="py-10 text-center text-slate-600 text-xs">
                © 2025 DocuQuery AI • Built with Next.js 15 & Clerk
              </footer>
            </div>
          </SignedOut>

          {/* DASHBOARD (Signed In) */}
          <SignedIn>
            <div className="flex flex-col h-screen relative z-10">
              <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-3 font-bold text-xl">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black shadow-lg">Q</div>
                    <span>DocuQuery</span>
                    {currentFile && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-4 flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20"
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">
                          {currentFile}
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-hidden">
                {React.Children.map(children, child => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { 
                      setCurrentFile, 
                      currentFile 
                    });
                  }
                  return child;
                })}
              </main>
            </div>
          </SignedIn>

        </body>
      </html>
    </ClerkProvider>
  );
}