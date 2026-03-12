"use client";

import { QRCodeSVG } from "qrcode.react";

interface EventQRCodeProps {
  url: string;
  size?: number;
}

export function EventQRCode({ url, size = 200 }: EventQRCodeProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
