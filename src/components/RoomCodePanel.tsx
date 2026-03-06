"use client";

import React, { useState, useCallback } from "react";
import { isValidRoomCode } from "@/lib/discovery";

interface RoomCodePanelProps {
    roomCode: string;
    onJoinRoom: (code: string) => void;
    peerId: string;
    peerCount: number;
}

export function RoomCodePanel({ roomCode, onJoinRoom, peerId, peerCount }: RoomCodePanelProps) {
    const [joinCode, setJoinCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = roomCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [roomCode]);

    const handleJoin = useCallback(() => {
        const code = joinCode.trim();
        if (!isValidRoomCode(code)) {
            setError("Enter a valid 6-digit code");
            return;
        }
        setError("");
        onJoinRoom(code);
    }, [joinCode, onJoinRoom]);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleJoin();
            }
        },
        [handleJoin]
    );

    return (
        <div className="room-panel" id="room-code-panel">
            {/* Current room code */}
            <div className="room-current">
                <div className="room-label-row">
                    <span className="room-label">Your Room</span>
                    <span className="room-peer-count">
                        <span className="room-dot" />
                        {peerCount} {peerCount === 1 ? "peer" : "peers"} connected
                    </span>
                </div>
                <div className="room-code-display">
                    <span className="room-code-text" id="room-code-display">{roomCode}</span>
                    <button className="room-copy-btn" onClick={handleCopy} title="Copy room code">
                        {copied ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                        )}
                    </button>
                </div>
                {peerId && (
                    <p className="room-peer-id">ID: {peerId.slice(0, 20)}...</p>
                )}
            </div>

            {/* Join another room */}
            <div className="room-join">
                <span className="room-join-label">Join a Room</span>
                <div className="room-join-input-row">
                    <input
                        type="text"
                        className="room-join-input"
                        placeholder="Enter 6-digit code"
                        value={joinCode}
                        onChange={(e) => {
                            setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                            setError("");
                        }}
                        onKeyDown={handleKeyPress}
                        maxLength={6}
                        id="room-join-input"
                    />
                    <button
                        className="room-join-btn"
                        onClick={handleJoin}
                        disabled={joinCode.length !== 6}
                        id="room-join-button"
                    >
                        Join
                    </button>
                </div>
                {error && <p className="room-error">{error}</p>}
            </div>
        </div>
    );
}
