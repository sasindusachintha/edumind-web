import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import * as attendanceApi from '../../api/attendance.js';
import { errMsg } from '../../utils.js';

const SCANNER_ELEMENT_ID = 'qr-attendance-reader';

/** Accepts either a bare token or a full /attendance/scan/{token} URL. */
function extractToken(decodedText) {
  const trimmed = String(decodedText || '').trim();
  const match = trimmed.match(/\/attendance\/scan\/([^/?#]+)/i);
  return match ? match[1] : trimmed;
}

export default function ScanAttendance() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message: string }
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, []);

  async function handleDecoded(decodedText) {
    if (busy) return;
    setBusy(true);
    try {
      await scannerRef.current?.clear();
    } catch {
      // ignore cleanup errors
    }
    setScanning(false);

    const token = extractToken(decodedText);
    try {
      const { data } = await attendanceApi.markAttendance(token);
      setResult({ ok: true, message: `${data.message} (${data.subjectCode} — ${data.subjectName})` });
    } catch (err) {
      setResult({ ok: false, message: errMsg(err, 'Unable to mark attendance.') });
    } finally {
      setBusy(false);
    }
  }

  function startScanning() {
    setResult(null);
    setScanning(true);

    // Deferred so the target <div> exists in the DOM before html5-qrcode looks for it.
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        SCANNER_ELEMENT_ID,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => handleDecoded(decodedText),
        () => {} // ignore per-frame decode errors
      );
    }, 0);
  }

  function stopScanning() {
    scannerRef.current?.clear().catch(() => {});
    setScanning(false);
  }

  return (
    <div>
      <PageHeader title="Scan Attendance QR" subtitle="Scan the QR code shown by your faculty to mark yourself present." />

      <div className="card mx-auto max-w-md text-center">
        {result ? (
          <div className={`flex flex-col items-center gap-2 py-6 ${result.ok ? 'text-success' : 'text-danger'}`}>
            {result.ok ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            <p className="text-sm font-medium">{result.message}</p>
            <button className="btn-primary-student mt-3" onClick={startScanning}>Scan another</button>
          </div>
        ) : scanning ? (
          <div>
            <div id={SCANNER_ELEMENT_ID} className="mx-auto" />
            <button className="btn-ghost mt-3 text-xs" onClick={stopScanning}>Cancel</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10">
            <QrCode size={32} className="text-ink/30" />
            <p className="text-sm text-ink/60">Tap below to open your camera and scan the attendance QR code.</p>
            <button className="btn-primary-student" onClick={startScanning}>
              <QrCode size={15} /> Scan Attendance QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
