"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataConnection } from "peerjs";
import {
    createPeer,
    attachPeerEvents,
    connectToPeer as peerConnect,
    attachConnectionEvents,
    destroyPeer,
} from "@/lib/peer";
import {
    generatePeerId,
    getHashedIP,
    detectDevice,
    type DeviceInfo,
} from "@/lib/discovery";

export interface PeerInfo {
    id: string;
    device: DeviceInfo;
    connection: DataConnection;
}

interface UsePeerOptions {
    roomCode: string;
}

export function usePeer({ roomCode }: UsePeerOptions) {
    const [myPeerId, setMyPeerId] = useState<string>("");
    const [myDevice] = useState<DeviceInfo>(() => detectDevice());
    const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState<string>("");
    const peerRef = useRef<ReturnType<typeof createPeer> | null>(null);
    const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
    const ipHashRef = useRef<string>("");
    const onDataCallbackRef = useRef<((data: unknown, peerId: string) => void) | null>(null);
    const roomCodeRef = useRef(roomCode);

    // Keep roomCodeRef in sync
    useEffect(() => {
        roomCodeRef.current = roomCode;
    }, [roomCode]);

    /** Register a callback for incoming data */
    const onData = useCallback(
        (callback: (data: unknown, peerId: string) => void) => {
            onDataCallbackRef.current = callback;
        },
        []
    );

    /** Send data to a specific peer */
    const sendData = useCallback((peerId: string, data: unknown) => {
        const conn = connectionsRef.current.get(peerId);
        if (conn && conn.open) {
            conn.send(data);
        }
    }, []);

    /** Handle an incoming or outgoing connection */
    const handleConnection = useCallback((conn: DataConnection) => {
        attachConnectionEvents(conn, {
            onOpen: () => {
                // Send our device info
                conn.send({
                    type: "device-info",
                    device: detectDevice(),
                    peerId: peerRef.current?.id ?? "",
                });
            },
            onData: (data: unknown) => {
                const msg = data as Record<string, unknown>;
                if (msg && msg.type === "device-info") {
                    const peerInfo: PeerInfo = {
                        id: msg.peerId as string,
                        device: msg.device as DeviceInfo,
                        connection: conn,
                    };
                    connectionsRef.current.set(peerInfo.id, conn);
                    setPeers((prev) => {
                        const next = new Map(prev);
                        next.set(peerInfo.id, peerInfo);
                        return next;
                    });
                } else {
                    // Forward to data callback
                    onDataCallbackRef.current?.(data, conn.peer);
                }
            },
            onClose: () => {
                connectionsRef.current.delete(conn.peer);
                setPeers((prev) => {
                    const next = new Map(prev);
                    next.delete(conn.peer);
                    return next;
                });
            },
            onError: (err) => {
                console.error("Connection error:", err);
            },
        });
    }, []);

    /** Connect to a peer by ID */
    const connectToPeer = useCallback(
        (remotePeerId: string) => {
            if (!peerRef.current || connectionsRef.current.has(remotePeerId)) return;
            const conn = peerConnect(peerRef.current, remotePeerId);
            handleConnection(conn);
        },
        [handleConnection]
    );

    /** Initialize the peer */
    useEffect(() => {
        // Don't init until we have a valid room code
        if (!roomCode || roomCode.length < 6) return;

        let destroyed = false;

        const init = async () => {
            try {
                const ipHash = await getHashedIP();
                ipHashRef.current = ipHash;

                // PeerJS IDs must be alphanumeric with hyphens/underscores only
                const prefix = `blink${roomCode}${ipHash}`;
                const peerId = generatePeerId(prefix);

                const peer = createPeer(peerId);
                peerRef.current = peer;

                attachPeerEvents(peer, {
                    onOpen: (id) => {
                        if (destroyed) return;
                        setMyPeerId(id);
                        setIsConnecting(false);
                    },
                    onConnection: (conn) => {
                        if (destroyed) return;
                        handleConnection(conn);
                    },
                    onDisconnect: () => {
                        if (destroyed) return;
                        // Try to reconnect
                        peer.reconnect();
                    },
                    onError: (err) => {
                        if (destroyed) return;
                        console.error("Peer error:", err);
                        setError(err.message);
                        setIsConnecting(false);
                    },
                });
            } catch (err) {
                if (!destroyed) {
                    setError((err as Error).message);
                    setIsConnecting(false);
                }
            }
        };

        init();

        return () => {
            destroyed = true;
            destroyPeer(peerRef.current);
            peerRef.current = null;
            connectionsRef.current.clear();
        };
    }, [roomCode, handleConnection]);

    return {
        myPeerId,
        myDevice,
        peers,
        isConnecting,
        error,
        connectToPeer,
        sendData,
        onData,
        ipHash: ipHashRef.current,
    };
}
