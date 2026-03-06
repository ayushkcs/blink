"use client";

import { useCallback, useRef, useState } from "react";
import {
    generateTransferId,
    calculateTotalChunks,
    getFileChunk,
    blobToArrayBuffer,
    assembleFile,
    downloadBlob,
    CHUNK_SIZE,
    type FileMetadata,
    type FileRequest,
    type FileResponse,
} from "@/lib/file-transfer";

export interface TransferState {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    progress: number; // 0-100
    speed: number; // bytes/sec
    eta: number; // seconds
    direction: "send" | "receive";
    status: "pending" | "requesting" | "transferring" | "completed" | "rejected" | "error";
    peerId: string;
}

export interface IncomingFileRequest {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    peerId: string;
}

interface UseFileTransferOptions {
    sendData: (peerId: string, data: unknown) => void;
}

export function useFileTransfer({ sendData }: UseFileTransferOptions) {
    const [transfers, setTransfers] = useState<Map<string, TransferState>>(new Map());
    const [incomingRequests, setIncomingRequests] = useState<IncomingFileRequest[]>([]);

    // Internal state that doesn't need re-render
    const chunksBufferRef = useRef<Map<string, ArrayBuffer[]>>(new Map());
    const fileMapRef = useRef<Map<string, File>>(new Map());
    const metaMapRef = useRef<
        Map<string, { name: string; size: number; mimeType: string; totalChunks: number }>
    >(new Map());
    const startTimeRef = useRef<Map<string, number>>(new Map());
    const bytesTransferredRef = useRef<Map<string, number>>(new Map());

    /** Update a single transfer state field */
    const updateTransfer = useCallback(
        (id: string, updates: Partial<TransferState>) => {
            setTransfers((prev) => {
                const next = new Map(prev);
                const existing = next.get(id);
                if (existing) {
                    next.set(id, { ...existing, ...updates });
                }
                return next;
            });
        },
        []
    );

    /** Send a file to a peer */
    const sendFile = useCallback(
        (peerId: string, file: File) => {
            const transferId = generateTransferId();
            const totalChunks = calculateTotalChunks(file.size);

            // Store file for chunked sending
            fileMapRef.current.set(transferId, file);

            // Create transfer state
            const transfer: TransferState = {
                id: transferId,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || "application/octet-stream",
                progress: 0,
                speed: 0,
                eta: 0,
                direction: "send",
                status: "requesting",
                peerId,
            };

            setTransfers((prev) => {
                const next = new Map(prev);
                next.set(transferId, transfer);
                return next;
            });

            // Send file request to peer
            const request: FileRequest = {
                type: "file-request",
                id: transferId,
                name: file.name,
                size: file.size,
                mimeType: file.type || "application/octet-stream",
            };
            sendData(peerId, request);

            // Store metadata
            metaMapRef.current.set(transferId, {
                name: file.name,
                size: file.size,
                mimeType: file.type || "application/octet-stream",
                totalChunks,
            });

            return transferId;
        },
        [sendData]
    );

    /** Start actually sending chunks after acceptance */
    const startSending = useCallback(
        async (transferId: string, peerId: string) => {
            const file = fileMapRef.current.get(transferId);
            const meta = metaMapRef.current.get(transferId);
            if (!file || !meta) return;

            // Send metadata header
            const metaMsg: FileMetadata = {
                type: "file-meta",
                id: transferId,
                name: meta.name,
                size: meta.size,
                mimeType: meta.mimeType,
                totalChunks: meta.totalChunks,
            };
            sendData(peerId, metaMsg);

            updateTransfer(transferId, { status: "transferring" });
            startTimeRef.current.set(transferId, Date.now());
            bytesTransferredRef.current.set(transferId, 0);

            // Send chunks sequentially with small delays to avoid overwhelming the data channel
            for (let i = 0; i < meta.totalChunks; i++) {
                const chunk = getFileChunk(file, i);
                const buffer = await blobToArrayBuffer(chunk);

                sendData(peerId, {
                    type: "file-chunk",
                    id: transferId,
                    index: i,
                    data: buffer,
                });

                // Update progress
                const bytesSent = Math.min((i + 1) * CHUNK_SIZE, meta.size);
                bytesTransferredRef.current.set(transferId, bytesSent);
                const elapsed = (Date.now() - (startTimeRef.current.get(transferId) ?? Date.now())) / 1000;
                const speed = elapsed > 0 ? bytesSent / elapsed : 0;
                const remaining = meta.size - bytesSent;
                const eta = speed > 0 ? remaining / speed : 0;
                const progress = Math.round((bytesSent / meta.size) * 100);

                updateTransfer(transferId, { progress, speed, eta });

                // Small yield to avoid blocking
                if (i % 10 === 0) {
                    await new Promise((r) => setTimeout(r, 1));
                }
            }

            // Send completion signal
            sendData(peerId, { type: "file-complete", id: transferId });
            updateTransfer(transferId, { progress: 100, status: "completed", eta: 0 });

            // Cleanup
            fileMapRef.current.delete(transferId);
        },
        [sendData, updateTransfer]
    );

    /** Accept an incoming file request */
    const acceptFile = useCallback(
        (transferId: string, peerId: string) => {
            const response: FileResponse = {
                type: "file-response",
                id: transferId,
                accepted: true,
            };
            sendData(peerId, response);
            setIncomingRequests((prev) => prev.filter((r) => r.id !== transferId));
        },
        [sendData]
    );

    /** Reject an incoming file request */
    const rejectFile = useCallback(
        (transferId: string, peerId: string) => {
            const response: FileResponse = {
                type: "file-response",
                id: transferId,
                accepted: false,
            };
            sendData(peerId, response);
            setIncomingRequests((prev) => prev.filter((r) => r.id !== transferId));
            setTransfers((prev) => {
                const next = new Map(prev);
                next.delete(transferId);
                return next;
            });
        },
        [sendData]
    );

    /** Handle incoming data from a peer */
    const handleIncomingData = useCallback(
        (data: unknown, peerId: string) => {
            const msg = data as Record<string, unknown>;
            if (!msg || !msg.type) return;

            switch (msg.type) {
                case "file-request": {
                    const req = msg as unknown as FileRequest;
                    // Show incoming request to user
                    setIncomingRequests((prev) => [
                        ...prev,
                        {
                            id: req.id,
                            name: req.name,
                            size: req.size,
                            mimeType: req.mimeType,
                            peerId,
                        },
                    ]);
                    // Create receive transfer state
                    const transfer: TransferState = {
                        id: req.id,
                        fileName: req.name,
                        fileSize: req.size,
                        mimeType: req.mimeType,
                        progress: 0,
                        speed: 0,
                        eta: 0,
                        direction: "receive",
                        status: "pending",
                        peerId,
                    };
                    setTransfers((prev) => {
                        const next = new Map(prev);
                        next.set(req.id, transfer);
                        return next;
                    });
                    break;
                }

                case "file-response": {
                    const res = msg as unknown as FileResponse;
                    if (res.accepted) {
                        // Start sending chunks
                        startSending(res.id, peerId);
                    } else {
                        updateTransfer(res.id, { status: "rejected" });
                    }
                    break;
                }

                case "file-meta": {
                    const meta = msg as unknown as FileMetadata;
                    metaMapRef.current.set(meta.id, {
                        name: meta.name,
                        size: meta.size,
                        mimeType: meta.mimeType,
                        totalChunks: meta.totalChunks,
                    });
                    chunksBufferRef.current.set(meta.id, new Array(meta.totalChunks));
                    startTimeRef.current.set(meta.id, Date.now());
                    bytesTransferredRef.current.set(meta.id, 0);
                    updateTransfer(meta.id, { status: "transferring" });
                    break;
                }

                case "file-chunk": {
                    const chunk = msg as unknown as { id: string; index: number; data: ArrayBuffer };
                    const buffer = chunksBufferRef.current.get(chunk.id);
                    const meta = metaMapRef.current.get(chunk.id);
                    if (!buffer || !meta) break;

                    buffer[chunk.index] = chunk.data;

                    // Update progress
                    const bytesReceived = Math.min((chunk.index + 1) * CHUNK_SIZE, meta.size);
                    bytesTransferredRef.current.set(chunk.id, bytesReceived);
                    const elapsed =
                        (Date.now() - (startTimeRef.current.get(chunk.id) ?? Date.now())) / 1000;
                    const speed = elapsed > 0 ? bytesReceived / elapsed : 0;
                    const remaining = meta.size - bytesReceived;
                    const eta = speed > 0 ? remaining / speed : 0;
                    const progress = Math.round((bytesReceived / meta.size) * 100);

                    updateTransfer(chunk.id, { progress, speed, eta });
                    break;
                }

                case "file-complete": {
                    const complete = msg as unknown as { id: string };
                    const buffer = chunksBufferRef.current.get(complete.id);
                    const meta = metaMapRef.current.get(complete.id);
                    if (!buffer || !meta) break;

                    // Assemble and download
                    const blob = assembleFile(buffer, meta.mimeType);
                    downloadBlob(blob, meta.name);

                    updateTransfer(complete.id, { progress: 100, status: "completed", eta: 0 });

                    // Cleanup
                    chunksBufferRef.current.delete(complete.id);
                    metaMapRef.current.delete(complete.id);
                    startTimeRef.current.delete(complete.id);
                    bytesTransferredRef.current.delete(complete.id);
                    break;
                }
            }
        },
        [startSending, updateTransfer]
    );

    /** Remove a completed/rejected transfer from the list */
    const clearTransfer = useCallback((transferId: string) => {
        setTransfers((prev) => {
            const next = new Map(prev);
            next.delete(transferId);
            return next;
        });
    }, []);

    return {
        transfers,
        incomingRequests,
        sendFile,
        acceptFile,
        rejectFile,
        handleIncomingData,
        clearTransfer,
    };
}
