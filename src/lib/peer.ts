/**
 * PeerJS wrapper — manages WebRTC peer connections via PeerJS
 */

import Peer, { DataConnection } from "peerjs";

export interface PeerEvents {
    onOpen: (id: string) => void;
    onConnection: (conn: DataConnection) => void;
    onDisconnect: () => void;
    onError: (err: Error) => void;
}

/** Create a new PeerJS instance with the given ID */
export function createPeer(peerId: string): Peer {
    const peer = new Peer(peerId, {
        debug: 1,
        config: {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:19302" },
            ],
        },
    });
    return peer;
}

/** Attach standard event handlers to a peer */
export function attachPeerEvents(peer: Peer, events: PeerEvents): void {
    peer.on("open", events.onOpen);
    peer.on("connection", events.onConnection);
    peer.on("disconnected", events.onDisconnect);
    peer.on("error", (err) => events.onError(err as Error));
}

/** Connect to another peer by ID, with reliable ordered data channel */
export function connectToPeer(
    peer: Peer,
    remotePeerId: string
): DataConnection {
    return peer.connect(remotePeerId, {
        reliable: true,
        serialization: "binary",
    });
}

/** Setup data channel event handlers */
export function attachConnectionEvents(
    conn: DataConnection,
    handlers: {
        onOpen?: () => void;
        onData?: (data: unknown) => void;
        onClose?: () => void;
        onError?: (err: Error) => void;
    }
): void {
    if (handlers.onOpen) conn.on("open", handlers.onOpen);
    if (handlers.onData) conn.on("data", handlers.onData);
    if (handlers.onClose) conn.on("close", handlers.onClose);
    if (handlers.onError) conn.on("error", (err) => handlers.onError?.(err as Error));
}

/** Destroy a peer connection cleanly */
export function destroyPeer(peer: Peer | null): void {
    if (peer && !peer.destroyed) {
        peer.destroy();
    }
}
