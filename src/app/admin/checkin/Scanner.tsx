"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { checkInByCode, type CheckInResult } from "@/app/actions/admin";
import { btn, inputCls } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export function Scanner({ initialCode }: { initialCode?: string }) {
  const [state, action] = useActionState<CheckInResult, FormData>(checkInByCode, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const lastCode = useRef<string>("");
  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  // auto-submit a code passed in the URL (opened by scanning a ticket with the phone camera)
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (initialCode && !autoSubmitted.current) {
      autoSubmitted.current = true;
      formRef.current?.requestSubmit();
    }
  }, [initialCode]);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector: Detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value && value !== lastCode.current) {
              lastCode.current = value;
              if (inputRef.current) inputRef.current.value = value;
              formRef.current?.requestSubmit();
              setTimeout(() => (lastCode.current = ""), 4000);
            }
          } catch {}
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setCamError("Camera unavailable. Allow camera access or enter the ticket code manually.");
        setScanning(false);
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-brand-950">
        {scanning ? (
          <video ref={videoRef} className="aspect-square w-full object-cover sm:aspect-video" muted playsInline aria-label="Camera preview" />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center text-brand-100">
            <p className="text-sm">{supported ? "Scan member QR tickets with this device's camera." : "Tip: scan the ticket QR with your phone's camera app — it opens this page and checks in automatically."}</p>
            {supported && <button type="button" onClick={() => { setCamError(null); setScanning(true); }} className={`${btn.base} ${btn.gold}`}>Start camera</button>}
          </div>
        )}
      </div>
      {scanning && <button type="button" onClick={() => setScanning(false)} className={`${btn.base} ${btn.outline} ${btn.sm}`}>Stop camera</button>}
      {camError && <p role="alert" className="text-sm text-red-700">{camError}</p>}

      <form ref={formRef} action={action} className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <label htmlFor="code" className="mb-1 block text-sm font-medium">Ticket code</label>
          <input ref={inputRef} id="code" name="code" defaultValue={initialCode} className={inputCls} autoComplete="off" placeholder="e.g. 3fK9aZ…" required />
        </div>
        <SubmitButton pendingText="Checking…">Check in</SubmitButton>
      </form>

      <div aria-live="assertive">
        {state?.error && <div role="alert" className="rounded-2xl bg-red-50 p-5 text-red-900"><p className="text-lg font-semibold">✕ {state.error}</p>{state.event && <p className="text-sm">{state.event}</p>}</div>}
        {state?.success && (
          <div className={`rounded-2xl p-5 ${state.already ? "bg-gold-300/40 text-brand-950" : "bg-emerald-50 text-emerald-900"}`}>
            <p className="text-2xl font-semibold">{state.success}</p>
            <p className="mt-1 text-lg">{state.name}</p>
            <p className="text-sm">{state.event}</p>
          </div>
        )}
      </div>
    </div>
  );
}
