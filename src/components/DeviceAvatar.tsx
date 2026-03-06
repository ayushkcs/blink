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
    const deviceIcon = getDeviceIcon(peer.device.type);
    const initial = peer.device.browser.charAt(0).toUpperCase();

    return (
        <button
            className={`device-avatar ${isSelected ? "device-avatar-selected" : ""}`}
            onClick={onClick}
            title={peer.device.name}
            id={`peer-${peer.id}`}
        >
            {/* Progress ring */}
            {progress !== undefined && progress > 0 && progress < 100 && (
                <svg className="device-progress-ring" viewBox="0 0 44 44">
                    <circle
                        cx="22"
                        cy="22"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.15"
                    />
                    <circle
                        cx="22"
                        cy="22"
                        r="20"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                        transform="rotate(-90 22 22)"
                    />
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>
            )}

            <div className="device-avatar-inner">
                <span className="device-icon">{deviceIcon}</span>
                <span className="device-initial">{initial}</span>
            </div>

            <span className="device-name">{peer.device.browser}</span>
        </button>
    );
}

function getDeviceIcon(type: string): string {
    switch (type) {
        case "phone":
            return "📱";
        case "tablet":
            return "📱";
        default:
            return "💻";
    }
}
