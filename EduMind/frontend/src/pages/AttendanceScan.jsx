import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import * as attendanceApi from '../api/attendance';
import { errMsg } from '../utils';

/**
 * This is the page a student lands on after their phone's camera app scans
 * the faculty's QR code (which encodes /attendance/scan/{token}). The
 * backend validates the token, expiry, and duplicate records, then marks
 * attendance automatically — no extra taps needed.
 */
export default function AttendanceScan() {
  const { token } = useParams();
  const [status, setStatus] = useState('checking'); // checking | marking | done | error
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { data } = await attendanceApi.verifyQrToken(token);
        if (cancelled) return;
        setInfo(data);

        if (!data.valid) {
          setStatus('error');
          setMessage('This attendance QR code has expired.');
          return;
        }
        if (data.alreadyMarked) {
          setStatus('done');
          setMessage('You have already marked attendance for this session.');
          return;
        }

        setStatus('marking');
        const { data: markResult } = await attendanceApi.markAttendance(token);
        if (cancelled) return;
        setStatus('done');
        setMessage(markResult.message);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(errMsg(err, 'This QR code is invalid or could not be verified.'));
      }
    }

    run();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <div className="w-full max-w-sm rounded-card border border-slate bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-student">
          <GraduationCap size={22} className="text-white" />
        </div>

        {info && (
          <p className="mb-3 text-sm text-ink/50">{info.subjectCode} — {info.subjectName}</p>
        )}

        {(status === 'checking' || status === 'marking') && (
          <div className="flex flex-col items-center gap-3 py-4 text-ink/60">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">{status === 'checking' ? 'Checking QR code…' : 'Marking your attendance…'}</p>
          </div>
        )}

        {status === 'done' && (
          <div className="flex flex-col items-center gap-2 py-4 text-success">
            <CheckCircle2 size={32} />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-2 py-4 text-danger">
            <XCircle size={32} />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <Link to="/student/attendance" className="mt-5 inline-block text-sm font-medium text-admin hover:underline">
          Go to my attendance
        </Link>
      </div>
    </div>
  );
}
