"use client";

import { useRef, useState } from "react";

type Props = {
  file: File | null;
  onBack: () => void;
  onNext: (file: File) => void;
};

export default function IdUploadStep({ file, onBack, onNext }: Props) {
  const [local, setLocal] = useState<File | null>(file);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = (f: File) => {
    if (!f.type.startsWith("image/") && !/pdf$/i.test(f.type)) {
      setErr("Upload an image or PDF");
      return;
    }
    setErr(null);
    setLocal(f);
  };

  return (
    <div>
      <p className="text-sm text-white/80 mb-2">Upload your ID (college/school/company)</p>

      <div
        className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70 hover:bg-white/10 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        {local ? (
          <div>
            <p className="mb-1 text-white">{local.name}</p>
            <p className="text-xs">Click to replace</p>
          </div>
        ) : (
          <p>Click to choose a file (PNG/JPG/PDF)</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
          Back
        </button>
        <button
          onClick={() => local && onNext(local)}
          disabled={!local}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white py-2"
        >
          Submit
        </button>
      </div>

      <p className="mt-3 text-[11px] text-white/60">
        We store only what’s needed to verify you. By continuing you agree to our Privacy Policy.
      </p>
    </div>
  );
}
