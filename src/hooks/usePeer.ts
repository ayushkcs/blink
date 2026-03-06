"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import { attachConnectionEvents, destroyPeer } from "@/lib/peer";
import { getHashedIP, detectDevice, type DeviceInfo } from "@/lib/discovery";

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
    const heartbeatsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
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

    /** Remove a peer and clean up */
    const removePeer = useCallback(
        (conn: DataConnection, isHostRole: boolean) => {
            const peerId = conn.peer;
            // Clear heartbeat
            const hb = heartbeatsRef.current.get(peerId);
            if (hb) clearInterval(hb);
            heartbeatsRef.current.delete(peerId);
            // Remove connection
            connectionsRef.current.delete(peerId);
            // Update UI
            setPeers((prev) => {
                const next = new Map(prev);
                next.forEach((info, key) => {
                    if (info.connection === conn || key === peerId) next.delete(key);
                });
                return next;
            });
            if (isHostRole) broadcastPeerList();
            try {
                conn.close();
            } catch {
                /* already closed */
            }
        },
        [broadcastPeerList]
    );

    /** Handle an established connection */
    const handleConnection = useCallback(
        (conn: DataConnection, isHostRole: boolean) => {
            let lastPong = Date.now();

            const startHeartbeat = () => {
                const interval = setInterval(() => {
                    if (conn.open) {
                        try {
                            conn.send({ type: "ping" });
                        } catch {
                            /* ignore */
                        }
                        // No pong in 10s → dead
                        if (Date.now() - lastPong > 10000) {
                            removePeer(conn, isHostRole);
                        }
                    } else {
                        removePeer(conn, isHostRole);
                    }
                }, 3000);
                heartbeatsRef.current.set(conn.peer, interval);
            };

            attachConnectionEvents(conn, {
                onOpen: () => {
                    conn.send({
                        type: "device-info",
                        device: detectDevice(),
                        peerId: peerRef.current?.id ?? "",
                    });
                    lastPong = Date.now();
                    startHeartbeat();
                },
                onData: (data: unknown) => {
                    const msg = data as Record<string, unknown>;
                    if (!msg || !msg.type) return;

                    // Heartbeat protocol
                    if (msg.type === "ping") {
                        if (conn.open) conn.send({ type: "pong" });
                        return;
                    }
                    if (msg.type === "pong") {
                        lastPong = Date.now();
                        return;
                    }
                    if (msg.type === "peer-leaving") {
                        removePeer(conn, isHostRole);
                        return;
                    }

                    // Discovery protocol
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
                        if (isHostRole) broadcastPeerList();
                    } else if (msg.type === "peer-list") {
                        const peerList = msg.peers as string[];
                        const myId = peerRef.current?.id;
                        peerList.forEach((pid) => {
                            if (pid !== myId && !connectionsRef.current.has(pid)) {
                                const newConn = peerRef.current!.connect(pid, {
                                    reliable: true,
                                    serialization: "binary",
                                });
                                handleConnection(newConn, false);
                            }
                        });
                    } else {
                        onDataCallbackRef.current?.(data, conn.peer);
                    }
                },
                onClose: () => {
                    removePeer(conn, isHostRole);
                },
                onError: (err) => {
                    console.warn("Connection error:", err.message);
                    removePeer(conn, isHostRole);
                },
            });
        },
        [broadcastPeerList, removePeer]
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
                const { default: PeerJS } = await import("peerjs");

                const iceConfig = {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:stun1.l.google.com:19302" },
                        { urls: "stun:stun2.l.google.com:19302" },
                    ],
                };

                // Step 1: Try to become the host
                const tryAsHost = () =>
                    new Promise<boolean>((resolve) => {
                        const hostPeer = new PeerJS(hostId, { debug: 0, config: iceConfig });

                        const timeout = setTimeout(() => {
                            hostPeer.destroy();
                            resolve(false);
                        }, 6000);

                        hostPeer.on("open", () => {
                            clearTimeout(timeout);
                            if (destroyedRef.current) {
                                hostPeer.destroy();
                                return;
                            }
                            peerRef.current = hostPeer;
                            setMyPeerId(hostId);
                            setIsHost(true);
                            setIsConnecting(false);

                            hostPeer.on("connection", (conn) => {
                                if (!destroyedRef.current) handleConnection(conn, true);
                            });
                            hostPeer.on("disconnected", () => {
                                if (!destroyedRef.current) hostPeer.reconnect();
                            });
                            resolve(true);
                        });

                        hostPeer.on("error", () => {
                            clearTimeout(timeout);
                            hostPeer.destroy();
                            resolve(false);
                        });
                    });

                // Step 2: Connect as a client to the host
                const connectAsClient = () =>
                    new Promise<boolean>((resolve) => {
                        const randomSuffix = Math.random().toString(36).slice(2, 8);
                        const clientId = `blink${ipHash}${randomSuffix}`;

                        const clientPeer = new PeerJS(clientId, { debug: 0, config: iceConfig });

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

                            const conn = clientPeer.connect(hostId, {
                                reliable: true,
                                serialization: "binary",
                            });
                            handleConnection(conn, false);

                            clientPeer.on("connection", (inConn) => {
                                if (!destroyedRef.current) handleConnection(inConn, false);
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

        // Graceful disconnect on tab close
        const handleBeforeUnload = () => {
            connectionsRef.current.forEach((conn) => {
                try {
                    conn.send({ type: "peer-leaving" });
                } catch {
                    /* ignore */
                }
            });
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            destroyedRef.current = true;
            window.removeEventListener("beforeunload", handleBeforeUnload);
            // Clear all heartbeats
            heartbeatsRef.current.forEach((interval) => clearInterval(interval));
            heartbeatsRef.current.clear();
            // Notify peers and destroy
            connectionsRef.current.forEach((conn) => {
                try {
                    conn.send({ type: "peer-leaving" });
                    conn.close();
                } catch {
                    /* ignore */
                }
            });
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
