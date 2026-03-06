"use client";

import React, { useCallback, useRef, useState } from "react";
import { formatBytes } from "@/lib/file-transfer";

interface DropZoneProps {
    onFilesSelected: (files: File[]) => void;
    selectedPeer: string | null;
    disabled?: boolean;
}

export function DropZone({ onFilesSelected, selectedPeer, disabled }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            if (disabled) return;

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                setSelectedFiles(files);
                onFilesSelected(files);
            }
        },
        [disabled, onFilesSelected]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) {
                setSelectedFiles(files);
                onFilesSelected(files);
            }
        },
        [onFilesSelected]
    );

    const handleClick = useCallback(() => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    }, [disabled]);

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return "🖼️";
        if (type.startsWith("video/")) return "🎬";
        if (type.startsWith("audio/")) return "🎵";
        if (type.includes("pdf")) return "📄";
        if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return "📦";
        if (type.includes("text")) return "📝";
        return "📎";
    };

    return (
        <div className="dropzone-wrapper" id="drop-zone">
            <div
                className={`dropzone ${isDragOver ? "dropzone-active" : ""} ${disabled ? "dropzone-disabled" : ""
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    className="dropzone-input"
                    multiple
                    id="file-input"
                />

                {selectedFiles.length === 0 ? (
                    <div className="dropzone-content">
                        <div className="dropzone-icon">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p className="dropzone-title">
                            {selectedPeer ? "Drop files to send" : "Select a peer first"}
                        </p>
                        <p className="dropzone-hint">
                            Drag & drop any file or <span className="dropzone-browse">browse</span>
                        </p>
                        <p className="dropzone-formats">PDF, PNG, JPG, GIF, ZIP, MP4, any format</p>
                    </div>
                ) : (
                    <div className="dropzone-files">
                        {selectedFiles.map((file, i) => (
                            <div key={i} className="dropzone-file-item">
                                <span className="dropzone-file-icon">{getFileIcon(file.type)}</span>
                                <div className="dropzone-file-info">
                                    <span className="dropzone-file-name">{file.name}</span>
                                    <span className="dropzone-file-size">{formatBytes(file.size)}</span>
                                </div>
                            </div>
                        ))}
                        <p className="dropzone-file-action">
                            {selectedPeer ? "Sending..." : "Select a peer to send"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
