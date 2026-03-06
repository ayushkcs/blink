"use client";

import React from "react";
import { DeviceAvatar } from "./DeviceAvatar";
import type { PeerInfo } from "@/hooks/usePeer";
import type { TransferState } from "@/hooks/useFileTransfer";

interface RadarViewProps {
    peers: Map<string, PeerInfo>;
    selectedPeer: string | null;
    onSelectPeer: (peerId: string) => void;
    transfers: Map<string, TransferState>;
}

export function RadarView({ peers, selectedPeer, onSelectPeer, transfers }: RadarViewProps) {
    const peerArray = Array.from(peers.values());

    // Position peers around concentric rings
    const getPeerPosition = (index: number, total: number) => {
        const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
        const ring = 0.6 + (index % 3) * 0.12; // Vary the radius
        const x = 50 + Math.cos(angle) * (ring * 38);
        const y = 50 + Math.sin(angle) * (ring * 38);
        return { x, y };
    };

    return (
        <div className="radar-container" id="radar-view">
            <div className="radar-wrapper">
                {/* Radar SVG */}
                <svg viewBox="0 0 100 100" className="radar-svg">
                    {/* Background circles */}
                    <circle cx="50" cy="50" r="38" className="radar-ring" />
                    <circle cx="50" cy="50" r="28" className="radar-ring" />
                    <circle cx="50" cy="50" r="18" className="radar-ring" />
                    <circle cx="50" cy="50" r="8" className="radar-ring" />

                    {/* Cross lines */}
                    <line x1="50" y1="12" x2="50" y2="88" className="radar-line" />
                    <line x1="12" y1="50" x2="88" y2="50" className="radar-line" />

                    {/* Sweep animation */}
                    <g className="radar-sweep-group">
                        <path
                            d="M50,50 L50,12 A38,38 0 0,1 82.9,31"
                            className="radar-sweep"
                        />
                    </g>

                    {/* Center pulse */}
                    <circle cx="50" cy="50" r="4" className="radar-center" />
                    <circle cx="50" cy="50" r="4" className="radar-pulse" />
                </svg>

                {/* Peer avatars overlaid on radar */}
                <div className="radar-peers">
                    {peerArray.map((peer, i) => {
                        const pos = getPeerPosition(i, peerArray.length);
                        const transfer = Array.from(transfers.values()).find(
                            (t) => t.peerId === peer.id && t.status === "transferring"
                        );
                        return (
                            <div
                                key={peer.id}
                                className="radar-peer-item"
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                }}
                            >
                                <DeviceAvatar
                                    peer={peer}
                                    isSelected={selectedPeer === peer.id}
                                    onClick={() => onSelectPeer(peer.id)}
                                    progress={transfer?.progress}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {peerArray.length === 0 && (
                    <div className="radar-empty">
                        <div className="radar-empty-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                        </div>
                        <p className="radar-empty-text">Waiting for peers...</p>
                        <p className="radar-empty-hint">
                            Open Blink on another device on the same Wi-Fi
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
