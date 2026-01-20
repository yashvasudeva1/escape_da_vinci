"use client";

import { useState } from "react";

interface FileUploadProps {
  onUploadComplete: (result: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      setError("Please upload a CSV or Excel file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      onUploadComplete(result);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      style={{
        padding: "48px",
        background: "var(--bg-secondary)",
        border: dragActive
          ? "2px dashed var(--color-navy)"
          : "2px dashed var(--border-standard)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        transition: "all 0.2s",
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {uploading ? (
        <>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid var(--border-subtle)",
              borderTop: "4px solid var(--color-navy)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Processing dataset...
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "2px solid var(--border-standard)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Upload Dataset
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            Drag and drop your CSV or Excel file here, or click to browse
          </div>
          <label
            style={{
              padding: "10px 20px",
              background: "var(--color-navy)",
              color: "white",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            Choose File
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleChange}
              style={{ display: "none" }}
            />
          </label>
          {error && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--status-error)",
                marginTop: "8px",
              }}
            >
              {error}
            </div>
          )}
        </>
      )}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
