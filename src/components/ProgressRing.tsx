"use client";

import React from "react";
import { formatBytes, formatETA } from "@/lib/file-transfer";
import type { TransferState } from "@/hooks/useFileTransfer";

interface ProgressRingProps {
    transfer: TransferState;
    onClear?: () => void;
}

export function ProgressRing({ transfer, onClear }: ProgressRingProps) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - transfer.progress / 100);

    const isComplete = transfer.status === "completed";
    const isRejected = transfer.status === "rejected";
    const isError = transfer.status === "error";

    return (
        <div className={`progress-card ${isComplete ? "progress-card-complete" : ""}`} id={`transfer-${transfer.id}`}>
            <div className="progress-ring-wrapper">
                <svg className="progress-ring-svg" viewBox="0 0 80 80">
                    {/* Background circle */}
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.1"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="url(#transferGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform="rotate(-90 40 40)"
                        className="progress-ring-circle"
                    />
                    <defs>
                        <linearGradient id="transferGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="progress-ring-text">
                    {isComplete ? (
                        <span className="progress-check">✓</span>
                    ) : isRejected ? (
                        <span className="progress-rejected">✕</span>
                    ) : isError ? (
                        <span className="progress-error">!</span>
                    ) : (
                        <span className="progress-percent">{transfer.progress}%</span>
                    )}
                </div>
            </div>

            <div className="progress-info">
                <p className="progress-filename" title={transfer.fileName}>
                    {transfer.fileName}
                </p>
                <p className="progress-details">
                    {isComplete
                        ? `${formatBytes(transfer.fileSize)} — Done`
                        : isRejected
                            ? "Rejected"
                            : isError
                                ? "Error"
                                : `${formatBytes(transfer.speed)}/s · ${formatETA(transfer.eta)}`}
                </p>
                <div className="progress-bar-track">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${transfer.progress}%` }}
                    />
                </div>
            </div>

            {(isComplete || isRejected || isError) && onClear && (
                <button className="progress-clear" onClick={onClear} title="Dismiss">
                    ×
                </button>
            )}
        </div>
    );
}
