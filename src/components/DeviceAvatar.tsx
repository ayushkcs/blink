"use client";

import React from "react";
import type { PeerInfo } from "@/hooks/usePeer";

interface DeviceAvatarProps {
    peer: PeerInfo;
    isSelected: boolean;
    onClick: () => void;
    progress?: number;
}

export function DeviceAvatar({ peer, isSelected, onClick, progress }: DeviceAvatarProps) {
    const { gradient, iconColor, glowColor } = getDeviceTheme(peer.device.type);

    return (
        <button
            className={`device-avatar ${isSelected ? "device-avatar-selected" : ""}`}
            onClick={onClick}
            title={`${peer.device.name} — Click to select`}
            id={`peer-${peer.id}`}
        >
            {/* Outer glow when selected */}
            {isSelected && (
                <div
                    className="device-avatar-glow"
                    style={{ background: glowColor }}
                />
            )}

            {/* Progress ring */}
            {progress !== undefined && progress > 0 && progress < 100 && (
                <svg className="device-progress-ring" viewBox="0 0 80 80">
                    <circle
                        cx="40" cy="40" r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.1"
                    />
                    <circle
                        cx="40" cy="40" r="36"
                        fill="none"
                        stroke="url(#avatarProgressGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                        transform="rotate(-90 40 40)"
                    />
                    <defs>
                        <linearGradient id="avatarProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>
                </svg>
            )}

            {/* Main avatar circle */}
            <div className="device-avatar-inner" style={{ background: gradient }}>
                <DeviceIcon type={peer.device.type} color={iconColor} />
            </div>

            {/* Device label */}
            <span className="device-name">
                {peer.device.os === "Unknown" ? peer.device.browser : peer.device.os}
            </span>
        </button>
    );
}

/** SVG icons for each device type — much sharper than emojis */
function DeviceIcon({ type, color }: { type: string; color: string }) {
    switch (type) {
        case "phone":
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                </svg>
            );
        case "tablet":
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                </svg>
            );
        default: // desktop
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            );
    }
}

/** Device-type-specific color themes */
function getDeviceTheme(type: string) {
    switch (type) {
        case "phone":
            return {
                gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                iconColor: "#16a34a",
                glowColor: "rgba(22, 163, 74, 0.15)",
            };
        case "tablet":
            return {
                gradient: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                iconColor: "#ea580c",
                glowColor: "rgba(234, 88, 12, 0.15)",
            };
        default: // desktop
            return {
                gradient: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                iconColor: "#4f46e5",
                glowColor: "rgba(79, 70, 229, 0.15)",
            };
    }
}
