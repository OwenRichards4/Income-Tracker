"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, X } from "lucide-react";
import QRCode from "qrcode";

// Matches the fallback in login/actions.ts's magic-link redirect — same
// source of truth for "what URL is this app actually reachable at."
const LOGIN_URL = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`;

export function ShareQrButton() {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    // Fixed black-on-white regardless of theme — inverting it for dark mode
    // risks scan reliability, and this is the one UI element whose entire
    // job is being read by a camera, not a person.
    QRCode.toCanvas(canvasRef.current, LOGIN_URL, {
      width: 220,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show sign-in QR code"
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <QrCode className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-card p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Scan to sign in</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
              <canvas ref={canvasRef} />
            </div>
            <p className="mt-3 break-all text-center text-xs text-muted-foreground">
              {LOGIN_URL}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
