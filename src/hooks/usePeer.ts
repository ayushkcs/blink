"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import {
    attachConnectionEvents,
    destroyPeer,
} from "@/lib/peer";
import {
    getHashedIP,
    detectDevice,
    type DeviceInfo,
} from "@/lib/discovery";

export interface PeerInfo {
    id: string;
    device: DeviceInfo;
    connection: DataConnection | null;
}

export function usePeer() {
    const [myPeerId, setMyPeerId] = useState<string>("");
    const [myDevice] = useState<DeviceInfo>(() => detectDevice());
    const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
    const [isConnecting, setIsConnecting] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState<string>("");
    const [networkId, setNetworkId] = useState<string>("");

    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
    const onDataCallbackRef = useRef<((data: unknown, peerId: string) => void) | null>(null);
    const destroyedRef = useRef(false);
    const initedRef = useRef(false);

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

    /** Broadcast data to all connected peers */
    const broadcastPeerList = useCallback(() => {
        const peerList = Array.from(connectionsRef.current.keys());
        connectionsRef.current.forEach((conn) => {
            if (conn.open) {
                conn.send({ type: "peer-list", peers: peerList });
            }
        });
    }, []);

    /** Handle an established connection */
    const handleConnection = useCallback(
        (conn: DataConnection, isHostRole: boolean) => {
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
                    if (!msg || !msg.type) return;

                    if (msg.type === "device-info") {
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

                        // If we're the host, tell everyone about the new peer
                        if (isHostRole) {
                            broadcastPeerList();
                        }
                    } else if (msg.type === "peer-list") {
                        // We received a peer list from the host - connect to peers we don't know
                        const peerList = msg.peers as string[];
                        const myId = peerRef.current?.id;
                        peerList.forEach((pid) => {
                            if (pid !== myId && !connectionsRef.current.has(pid)) {
                                // Connect to this peer
                                const newConn = peerRef.current!.connect(pid, {
                                    reliable: true,
                                    serialization: "binary",
                                });
                                handleConnection(newConn, false);
                            }
                        });
                    } else {
                        // Forward to data callback (file transfer messages)
                        onDataCallbackRef.current?.(data, conn.peer);
                    }
                },
                onClose: () => {
                    const closedPeerId = conn.peer;
                    connectionsRef.current.delete(closedPeerId);
                    setPeers((prev) => {
                        const next = new Map(prev);
                        // Find and remove by connection
                        next.forEach((peerInfo, key) => {
                            if (peerInfo.connection === conn || key === closedPeerId) {
                                next.delete(key);
                            }
                        });
                        return next;
                    });

                    // If host, broadcast updated peer list
                    if (isHostRole) {
                        broadcastPeerList();
                    }
                },
                onError: (err) => {
                    console.warn("Connection error:", err.message);
                },
            });
        },
        [broadcastPeerList]
    );

    /** Initialize the peer connection */
    useEffect(() => {
        if (initedRef.current) return;
        initedRef.current = true;
        destroyedRef.current = false;

        const init = async () => {
            try {
                const ipHash = await getHashedIP();
                setNetworkId(ipHash);

                const hostId = `blink${ipHash}host`;

                // Dynamically import PeerJS (client-side only)
                const { default: PeerJS } = await import("peerjs");

                // Step 1: Try to become the host
                const tryAsHost = () =>
                    new Promise<boolean>((resolve) => {
                        const hostPeer = new PeerJS(hostId, {
                            debug: 0,
                            config: {
                                iceServers: [
                                    { urls: "stun:stun.l.google.com:19302" },
                                    { urls: "stun:stun1.l.google.com:19302" },
                                    { urls: "stun:stun2.l.google.com:19302" },
                                ],
                            },
                        });

                        const timeout = setTimeout(() => {
                            // If no error/open after 5s, something is wrong
                            hostPeer.destroy();
                            resolve(false);
                        }, 6000);

                        hostPeer.on("open", () => {
                            clearTimeout(timeout);
                            if (destroyedRef.current) {
                                hostPeer.destroy();
                                return;
                            }
                            // We are the host!
                            peerRef.current = hostPeer;
                            setMyPeerId(hostId);
                            setIsHost(true);
                            setIsConnecting(false);

                            // Listen for incoming connections
                            hostPeer.on("connection", (conn) => {
                                if (!destroyedRef.current) {
                                    handleConnection(conn, true);
                                }
                            });

                            hostPeer.on("disconnected", () => {
                                if (!destroyedRef.current) hostPeer.reconnect();
                            });

                            resolve(true);
                        });

                        hostPeer.on("error", (err) => {
                            clearTimeout(timeout);
                            hostPeer.destroy();
                            // ID is taken or unavailable — someone else is host
                            resolve(false);
                        });
                    });

                // Step 2: Connect as a client to the host
                const connectAsClient = () =>
                    new Promise<boolean>((resolve) => {
                        const randomSuffix = Math.random().toString(36).slice(2, 8);
                        const clientId = `blink${ipHash}${randomSuffix}`;

                        const clientPeer = new PeerJS(clientId, {
                            debug: 0,
                            config: {
                                iceServers: [
                                    { urls: "stun:stun.l.google.com:19302" },
                                    { urls: "stun:stun1.l.google.com:19302" },
                                    { urls: "stun:stun2.l.google.com:19302" },
                                ],
                            },
                        });

                        const timeout = setTimeout(() => {
                            clientPeer.destroy();
                            resolve(false);
                        }, 8000);

                        clientPeer.on("open", () => {
                            clearTimeout(timeout);
                            if (destroyedRef.current) {
                                clientPeer.destroy();
                                return;
                            }

                            peerRef.current = clientPeer;
                            setMyPeerId(clientId);
                            setIsHost(false);
                            setIsConnecting(false);

                            // Connect to the host
                            const conn = clientPeer.connect(hostId, {
                                reliable: true,
                                serialization: "binary",
                            });
                            handleConnection(conn, false);

                            // Also listen for incoming connections from other peers
                            clientPeer.on("connection", (inConn) => {
                                if (!destroyedRef.current) {
                                    handleConnection(inConn, false);
                                }
                            });

                            clientPeer.on("disconnected", () => {
                                if (!destroyedRef.current) clientPeer.reconnect();
                            });

                            resolve(true);
                        });

                        clientPeer.on("error", (err) => {
                            clearTimeout(timeout);
                            console.warn("Client peer error:", err);
                            clientPeer.destroy();
                            resolve(false);
                        });
                    });

                // Execute: try host first, then client
                const isHostNow = await tryAsHost();
                if (destroyedRef.current) return;

                if (!isHostNow) {
                    const connected = await connectAsClient();
                    if (!connected && !destroyedRef.current) {
                        // Neither host nor client worked — retry as host
                        // (the previous host may have disconnected)
                        const retryHost = await tryAsHost();
                        if (!retryHost && !destroyedRef.current) {
                            setError("Could not connect. Please refresh and try again.");
                            setIsConnecting(false);
                        }
                    }
                }
            } catch (err) {
                if (!destroyedRef.current) {
                    setError((err as Error).message);
                    setIsConnecting(false);
                }
            }
        };

        init();

        return () => {
            destroyedRef.current = true;
            destroyPeer(peerRef.current);
            peerRef.current = null;
            connectionsRef.current.clear();
        };
    }, [handleConnection]);

    return {
        myPeerId,
        myDevice,
        peers,
        isConnecting,
        isHost,
        error,
        sendData,
        onData,
        networkId,
    };
}
