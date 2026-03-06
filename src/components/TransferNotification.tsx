"use client";

import React from "react";
import { formatBytes } from "@/lib/file-transfer";
import type { IncomingFileRequest } from "@/hooks/useFileTransfer";

interface TransferNotificationProps {
    request: IncomingFileRequest;
    onAccept: () => void;
    onReject: () => void;
}

export function TransferNotification({ request, onAccept, onReject }: TransferNotificationProps) {
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) return "🖼️";
        if (mimeType.startsWith("video/")) return "🎬";
        if (mimeType.startsWith("audio/")) return "🎵";
        if (mimeType.includes("pdf")) return "📄";
        if (mimeType.includes("zip") || mimeType.includes("rar")) return "📦";
        return "📎";
    };

    return (
        <div className="transfer-notification" id={`notification-${request.id}`}>
            <div className="notification-content">
                <div className="notification-icon">{getFileIcon(request.mimeType)}</div>
                <div className="notification-info">
                    <p className="notification-title">Incoming File</p>
                    <p className="notification-filename">{request.name}</p>
                    <p className="notification-size">{formatBytes(request.size)}</p>
                </div>
            </div>
            <div className="notification-actions">
                <button className="notification-accept" onClick={onAccept} id={`accept-${request.id}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Accept
                </button>
                <button className="notification-reject" onClick={onReject} id={`reject-${request.id}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Reject
                </button>
            </div>
        </div>
    );
}
