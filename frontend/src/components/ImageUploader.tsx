'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageUploaderProps {
  assetType: 'avatar' | 'activity' | 'theme';
  childId?: string;
  onUpload: (url: string) => void;
  previewUrl?: string;
}

export default function ImageUploader({ assetType, childId, onUpload, previewUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const sign = await api.signUpload({
        asset_type: assetType,
        child_id: childId,
        filename: file.name,
        content_type: file.type,
      });

      const uploadRes = await fetch(sign.signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      await api.confirmUpload({
        bucket: sign.bucket,
        path: sign.path,
        asset_type: assetType,
        child_id: childId,
        public_url: sign.public_url,
      });

      onUpload(sign.public_url);
    } catch (err) {
      console.error('Upload error:', err);
      setPreview(previewUrl || null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full aspect-square rounded-3xl border-2 border-dashed border-gray-300 hover:border-kid-yellow hover:bg-kid-yellow/10 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-3xl" />
        ) : (
          <>
            <ImageIcon size={32} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400">
              {uploading ? 'Đang tải...' : 'Chọn ảnh'}
            </span>
          </>
        )}
      </button>
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => { setPreview(null); inputRef.current?.click(); }}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
        >
          <X size={14} className="text-gray-500" />
        </button>
      )}
    </div>
  );
}
