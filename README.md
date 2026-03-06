# Blink

A serverless, P2P instant file-sharing web application. Zero setup, zero sign-up.

## Features

- **Zero Setup** — No accounts, no servers, no installation
- **Automatic Discovery** — Finds peers on the same network via hashed public IP
- **Room Codes** — 6-digit codes for connecting across different networks
- **WebRTC P2P** — Files transfer directly between browsers via RTCDataChannel
- **Any File Type** — PDF, PNG, JPG, GIF, ZIP, MP4, and any other format
- **Chunked Transfer** — Handles large files with 64KB chunking (File.slice + ArrayBuffer)
- **Progress Indicators** — Circular and linear progress bars with speed + ETA
- **Radar UI** — Modern animated radar interface showing nearby peers
- **Drag & Drop** — Drop files directly onto the page to send

## Tech Stack

- **Next.js 16** + TypeScript + TailwindCSS
- **PeerJS** — WebRTC signaling (free cloud server)
- **WebRTC Data Channels** — Direct browser-to-browser file transfer
- **Vercel** — Serverless deployment

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. Open the app on two devices (or two browser tabs)
2. Both get a 6-digit room code — share it with the other person
3. Enter the room code to connect
4. Select the peer on the radar, drag & drop a file
5. The file transfers directly, peer-to-peer — never touches a server

## Deploy to Vercel

```bash
npx vercel
```

Or connect the GitHub repo to [Vercel](https://vercel.com) for automatic deploys.

## Architecture

```
Client A ←→ PeerJS Cloud (signaling only) ←→ Client B
         ←——— WebRTC Data Channel (file data) ———→
```

Only signaling metadata (SDP offers, ICE candidates) flows through PeerJS. All file data flows directly browser-to-browser.

## License

MIT
