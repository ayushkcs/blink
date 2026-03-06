"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { RadarView } from "@/components/RadarView";
import { DropZone } from "@/components/DropZone";
import { RoomCodePanel } from "@/components/RoomCodePanel";
import { ProgressRing } from "@/components/ProgressRing";
import { TransferNotification } from "@/components/TransferNotification";
import { usePeer } from "@/hooks/usePeer";
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { generateRoomCode } from "@/lib/discovery";

export default function SharePage() {
    const [roomCode, setRoomCode] = useState<string>("");
    const [selectedPeer, setSelectedPeer] = useState<string | null>(null);

    // Generate initial room code on mount
    useEffect(() => {
        setRoomCode(generateRoomCode());
    }, []);

    // PeerJS connection
    const { myPeerId, peers, isConnecting, error, sendData, onData } = usePeer({
        roomCode,
    });

    // File transfer engine
    const {
        transfers,
        incomingRequests,
        sendFile,
        acceptFile,
        rejectFile,
        handleIncomingData,
        clearTransfer,
    } = useFileTransfer({ sendData });

    // Register data handler
    useEffect(() => {
        onData((data: unknown, peerId: string) => {
            handleIncomingData(data, peerId);
        });
    }, [onData, handleIncomingData]);

    // Handle peer selection
    const handleSelectPeer = useCallback((peerId: string) => {
        setSelectedPeer((prev) => (prev === peerId ? null : peerId));
    }, []);

    // Handle files selected for sending
    const handleFilesSelected = useCallback(
        (files: File[]) => {
            if (!selectedPeer) return;
            files.forEach((file) => {
                sendFile(selectedPeer, file);
            });
        },
        [selectedPeer, sendFile]
    );

    // Handle joining a room
    const handleJoinRoom = useCallback(
        (code: string) => {
            setRoomCode(code);
            setSelectedPeer(null);
        },
        []
    );

    // Handle accepting incoming file
    const handleAccept = useCallback(
        (requestId: string, peerId: string) => {
            acceptFile(requestId, peerId);
        },
        [acceptFile]
    );

    // Handle rejecting incoming file
    const handleReject = useCallback(
        (requestId: string, peerId: string) => {
            rejectFile(requestId, peerId);
        },
        [rejectFile]
    );

    // Convert transfers map to array for rendering
    const transferArray = Array.from(transfers.values());
    const activeTransfers = transferArray.filter(
        (t) => t.status === "transferring" || t.status === "requesting" || t.status === "pending"
    );
    const completedTransfers = transferArray.filter(
        (t) => t.status === "completed" || t.status === "rejected" || t.status === "error"
    );

    return (
        <div className="app">
            <Header />

            <main className="main">
                {/* Connection status */}
                {isConnecting && (
                    <div className="status-bar status-connecting">
                        <div className="status-spinner" />
                        <span>Connecting to signaling server...</span>
                    </div>
                )}
                {error && (
                    <div className="status-bar status-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <div className="main-grid">
                    {/* Left: Radar + Drop Zone */}
                    <div className="main-left">
                        <RadarView
                            peers={peers}
                            selectedPeer={selectedPeer}
                            onSelectPeer={handleSelectPeer}
                            transfers={transfers}
                        />
                        <DropZone
                            onFilesSelected={handleFilesSelected}
                            selectedPeer={selectedPeer}
                            disabled={!selectedPeer}
                        />
                    </div>

                    {/* Right: Room Code + Transfers */}
                    <div className="main-right">
                        <RoomCodePanel
                            roomCode={roomCode}
                            onJoinRoom={handleJoinRoom}
                            peerId={myPeerId}
                            peerCount={peers.size}
                        />

                        {/* Incoming file requests */}
                        {incomingRequests.length > 0 && (
                            <div className="notifications-section">
                                <h3 className="section-title">Incoming Files</h3>
                                {incomingRequests.map((req) => (
                                    <TransferNotification
                                        key={req.id}
                                        request={req}
                                        onAccept={() => handleAccept(req.id, req.peerId)}
                                        onReject={() => handleReject(req.id, req.peerId)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Active transfers */}
                        {activeTransfers.length > 0 && (
                            <div className="transfers-section">
                                <h3 className="section-title">Active Transfers</h3>
                                {activeTransfers.map((t) => (
                                    <ProgressRing key={t.id} transfer={t} />
                                ))}
                            </div>
                        )}

                        {/* Completed transfers */}
                        {completedTransfers.length > 0 && (
                            <div className="transfers-section">
                                <h3 className="section-title">Completed</h3>
                                {completedTransfers.map((t) => (
                                    <ProgressRing
                                        key={t.id}
                                        transfer={t}
                                        onClear={() => clearTransfer(t.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Peer list for manual connect */}
                        {peers.size === 0 && !isConnecting && (
                            <div className="no-peers-hint">
                                <div className="hint-icon">📡</div>
                                <h3 className="hint-title">No peers found</h3>
                                <p className="hint-text">
                                    Open this app on another device on the same network, or share your room code with someone.
                                </p>
                                <div className="hint-steps">
                                    <div className="hint-step">
                                        <span className="hint-step-num">1</span>
                                        <span>Share room code <strong>{roomCode}</strong></span>
                                    </div>
                                    <div className="hint-step">
                                        <span className="hint-step-num">2</span>
                                        <span>Other user enters the code</span>
                                    </div>
                                    <div className="hint-step">
                                        <span className="hint-step-num">3</span>
                                        <span>Start sharing files instantly</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="footer">
                <p>Files are transferred directly between browsers — never stored on any server.</p>
                <p className="footer-sub">Powered by WebRTC · End-to-end encrypted</p>
            </footer>
        </div>
    );
}
