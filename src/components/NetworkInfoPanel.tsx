"use client";

import React from "react";

interface NetworkInfoPanelProps {
    networkId: string;
    peerId: string;
    peerCount: number;
    isHost: boolean;
    isConnecting: boolean;
}

export function NetworkInfoPanel({
    networkId,
    peerId,
    peerCount,
    isHost,
    isConnecting,
}: NetworkInfoPanelProps) {
    return (
        <div className="room-panel" id="network-info-panel">
            <div className="room-current" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                <div className="room-label-row">
                    <span className="room-label">Your Network</span>
                    <span className="room-peer-count">
                        {isConnecting ? (
                            <>
                                <div className="status-spinner" style={{ width: 8, height: 8 }} />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <span className="room-dot" />
                                {peerCount} {peerCount === 1 ? "device" : "devices"} nearby
                            </>
                        )}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 12px",
                            borderRadius: 9999,
                            background: isHost
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(99, 102, 241, 0.08)",
                            border: `1px solid ${isHost ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.15)"
                                }`,
                            fontSize: 11,
                            fontWeight: 600,
                            color: isHost ? "#10b981" : "#6366f1",
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 9999,
                                background: isHost ? "#10b981" : "#6366f1",
                            }}
                        />
                        {isHost ? "Host" : "Connected"}
                    </span>
                </div>

                {networkId && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 14px",
                            background: "var(--bg-elevated)",
                            borderRadius: "var(--radius-sm)",
                            marginBottom: 8,
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ color: "var(--text-muted)", flexShrink: 0 }}
                        >
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                            <circle cx="12" cy="20" r="1" />
                        </svg>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                    fontWeight: 600,
                                    marginBottom: 2,
                                }}
                            >
                                NETWORK ID
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    fontFamily: "monospace",
                                    letterSpacing: 1,
                                }}
                            >
                                {networkId}
                            </div>
                        </div>
                    </div>
                )}

                {peerId && (
                    <p className="room-peer-id">Peer: {peerId.slice(0, 24)}...</p>
                )}

                <div
                    style={{
                        marginTop: 12,
                        padding: "12px 14px",
                        background: "var(--gradient-subtle)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <p
                        style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            lineHeight: 1.5,
                        }}
                    >
                        💡 Devices on the <strong>same Wi-Fi network</strong> are automatically
                        discovered. Just open Blink on another device and they&apos;ll appear on
                        the radar.
                    </p>
                </div>
            </div>
        </div>
    );
}
