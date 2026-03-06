/**
 * File Transfer Engine — chunked file slicing, sending, and reassembly
 */

export const CHUNK_SIZE = 64 * 1024; // 64 KB chunks

/** Metadata sent before file data begins */
export interface FileMetadata {
    type: "file-meta";
    id: string;
    name: string;
    size: number;
    mimeType: string;
    totalChunks: number;
}

/** A single chunk message */
export interface FileChunk {
    type: "file-chunk";
    id: string;
    index: number;
    data: ArrayBuffer;
}

/** Signal that transfer is complete */
export interface FileComplete {
    type: "file-complete";
    id: string;
}

/** Request/response for accepting a file */
export interface FileRequest {
    type: "file-request";
    id: string;
    name: string;
    size: number;
    mimeType: string;
}

export interface FileResponse {
    type: "file-response";
    id: string;
    accepted: boolean;
}

export type TransferMessage =
    | FileMetadata
    | FileChunk
    | FileComplete
    | FileRequest
    | FileResponse;

/** Generate a unique transfer ID */
export function generateTransferId(): string {
    return `tf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Calculate total number of chunks for a file */
export function calculateTotalChunks(fileSize: number): number {
    return Math.ceil(fileSize / CHUNK_SIZE);
}

/** Slice a file into a specific chunk */
export function getFileChunk(file: File, chunkIndex: number): Blob {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    return file.slice(start, end);
}

/** Convert Blob to ArrayBuffer */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return blob.arrayBuffer();
}

/** Reassemble chunks into a downloadable Blob */
export function assembleFile(
    chunks: ArrayBuffer[],
    mimeType: string
): Blob {
    return new Blob(chunks, { type: mimeType });
}

/** Create a download link and trigger download */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Format seconds to human-readable ETA */
export function formatETA(seconds: number): string {
    if (!isFinite(seconds) || seconds <= 0) return "--";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
}
