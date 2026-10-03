import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';

interface FileUploadProps {
  onFileAnalyzed: (fileData: { name: string; type: string; base64?: string; content?: string }) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileAnalyzed, isAnalyzing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    setLoadedFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onFileAnalyzed({
          name: file.name,
          type: file.type,
          base64: base64,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        onFileAnalyzed({
          name: file.name,
          type: file.type,
          content: reader.result as string,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col font-mono text-xs select-none">
      {/* File Upload Header */}
      <div className="flex items-center space-x-1.5 mb-2 text-[#00f0ff] font-bold tracking-wider text-[11px]">
        <span className="text-[#00e5ff]">▸</span>
        <span>FILE UPLOAD</span>
      </div>

      {/* Drop Zone Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center p-4 border rounded-xs cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#00f0ff] bg-[#022837]/90 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            : 'border-[#144e59] bg-[#02141c]/80 hover:border-[#00e5ff] hover:bg-[#021822]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.json,.log,.md,.js,.ts,.py"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <Upload className="w-6 h-6 text-[#00e5ff] mb-2 stroke-[1.5]" />

        <div className="text-[11px] text-[#26e6e6] font-semibold text-center mb-1">
          Drop file here or <span className="text-[#00f0ff] underline">Click to Browse</span>
        </div>

        <div className="text-[9px] text-[#155e75] tracking-wider text-center">
          Images · Video · Audio · PDF · Docs · Code · Data
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-[#010e14]/90 flex items-center justify-center space-x-2 text-[#00ffcc]">
            <div className="w-3 h-3 rounded-full border-2 border-[#00ffcc] border-t-transparent animate-spin" />
            <span className="text-[11px] tracking-wider font-semibold">ANALYZING SCREEN/FILE...</span>
          </div>
        )}
      </div>

      {/* File status text at bottom (Matches user image) */}
      <div className="mt-1.5 text-[10px] text-[#155e75] flex items-center justify-between px-1">
        {loadedFileName ? (
          <div className="flex items-center space-x-1 text-[#00ffcc] truncate">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{loadedFileName}</span>
            <button onClick={handleClear} className="text-[#f43f5e] hover:text-white p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span>No file loaded - drop or click above to upload</span>
        )}
      </div>
    </div>
  );
};
