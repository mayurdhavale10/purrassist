"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import ProfileNameStep from "./ProfileNameStep";
import UsernameStep from "./UsernameStep";
import RoleStep, { RoleType } from "./RoleStep";
import IdUploadStep from "./IdUploadStep";
import SuccessStep from "./SuccessStep";
import ForgotPasswordStart from "./ForgotPasswordStart";

export type SignupState = {
  email: string;
  password: string;
  profileName: string;
  username: string;
  role: RoleType | null;
  idFile: File | null;
  idUploadedUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
  /** optional: where to send lane A users after success */
  onLaneASuccessNavigate?: (href: string) => void;
};

const emptySignup: SignupState = {
  email: "",
  password: "",
  profileName: "",
  username: "",
  role: null,
  idFile: null,
  idUploadedUrl: null,
};

type Lane = "A" | "B" | null;

export default function AuthModal({
  open,
  onClose,
  defaultTab = "signup",
  onLaneASuccessNavigate,
}: Props) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [stepIdx, setStepIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<SignupState>(emptySignup);
  const [lane, setLane] = useState<Lane>(null);

  // reset when closing
  useEffect(() => {
    if (!open) {
      setTab(defaultTab);
      setStepIdx(0);
      setState(emptySignup);
      setLane(null);
      setErr(null);
      setBusy(false);
    }
  }, [open, defaultTab]);

  /** Step 1: classify email → lane A/B */
  async function handleEmailNext(email: string) {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok || !j?.lane) {
        throw new Error(j?.error || "Could not classify email");
      }
      setLane(j.lane as Lane);
      setState((s) => ({ ...s, email }));
      setStepIdx(1);
    } catch (e: any) {
      setErr(e?.message || "Could not classify email");
    } finally {
      setBusy(false);
    }
  }

  /** After Username step → register, then sign in via Credentials */
  async function handleRegisterThenLogin() {
    setErr(null);
    setBusy(true);
    try {
      // 1) Register (send lane we just determined)
      const reg = await fetch("/api/auth/email/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
          profileName: state.profileName,
          username: state.username,
          lane, // <= IMPORTANT
        }),
      });
      const rj = await reg.json();
      if (!reg.ok || !rj?.ok) {
        throw new Error(rj?.error || "Registration failed");
      }

      // 2) Issue session cookie with NextAuth (credentials)
      const sres = await signIn("credentials", {
        email: state.email,
        password: state.password,
        redirect: false,
      });
      if (sres?.error) throw new Error(sres.error);

      // 3) Branch by lane
      if (lane === "A") {
        // Fast path: done!
        setStepIdx(6);
        // Optional: take them straight into the app
        onLaneASuccessNavigate?.("/connections");
      } else {
        // Lane B: ask role next
        setStepIdx(4);
      }
    } catch (e: any) {
      setErr(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  /** Login path (tab = login): call credentials directly */
  async function handleLoginPasswordNext(password: string) {
    setState((s) => ({ ...s, password }));
    setErr(null);
    setBusy(true);
    try {
      const sres = await signIn("credentials", {
        email: state.email,
        password,
        redirect: false,
      });
      if (sres?.error) throw new Error(sres.error);
      // login successful
      setStepIdx(6);
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  /** Lane B → ID upload (with cookies) */
  async function handleIdUpload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (state.role) fd.append("role", state.role);

      const r = await fetch("/api/verification/upload", {
        method: "POST",
        body: fd,
        credentials: "include", // <= IMPORTANT for session cookie
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || "Upload failed");
      }
      setState((s) => ({ ...s, idFile: file, idUploadedUrl: j.url ?? null }));
      setStepIdx(6);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const steps = useMemo(
    () => [
      // 0) Email
      <EmailStep
        key="email"
        value={state.email}
        onNext={handleEmailNext}
        onGoogle={() => signIn("google")}
      />,

      // 1) Password
      <PasswordStep
        key="password"
        value={state.password}
        onBack={() => setStepIdx(0)}
        onNext={(password) => {
          if (tab === "login") {
            // login flow
            handleLoginPasswordNext(password);
          } else {
            setState((s) => ({ ...s, password }));
            setStepIdx(2);
          }
        }}
      />,

      // 2) Profile name
      <ProfileNameStep
        key="name"
        value={state.profileName}
        onBack={() => setStepIdx(1)}
        onNext={(name) => {
          setState((s) => ({ ...s, profileName: name }));
          setStepIdx(3);
        }}
      />,

      // 3) Username
      <UsernameStep
        key="username"
        value={state.username}
        onBack={() => setStepIdx(2)}
        onNext={async (u) => {
          setState((s) => ({ ...s, username: u }));
          // For signup flow, immediately register + login
          if (tab === "signup") {
            await handleRegisterThenLogin();
          } else {
            // shouldn't happen normally, but keep safe
            setStepIdx(4);
          }
        }}
      />,

      // 4) Role (Lane B only)
      <RoleStep
        key="role"
        value={state.role}
        onBack={() => setStepIdx(3)}
        onNext={(role) => {
          setState((s) => ({ ...s, role }));
          setStepIdx(5);
        }}
      />,

      // 5) ID Upload (Lane B)
      <IdUploadStep
        key="id"
        file={state.idFile}
        onBack={() => setStepIdx(4)}
        onNext={handleIdUpload}
      />,

      // 6) Success
      <SuccessStep key="done" email={state.email} onFinish={onClose} />,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, tab, lane, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Glassy card */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/purr_assit_logo.webp" alt="PurrAssist" className="h-8 w-8 rounded" />
              <h2 className="text-white/90 text-lg font-semibold">PurrAssist</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/10 p-1">
            <button
              className={`py-2 rounded-lg text-sm transition ${
                tab === "login" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => {
                setTab("login");
                setStepIdx(0);
                setErr(null);
              }}
            >
              Log in
            </button>
            <button
              className={`py-2 rounded-lg text-sm transition ${
                tab === "signup" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => {
                setTab("signup");
                setStepIdx(0);
                setErr(null);
              }}
            >
              Sign up
            </button>
          </div>

          {/* Social row */}
          <div className="mb-5">
            <button
              onClick={() => signIn("google")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/15 py-2.5 text-white hover:bg-white/25 transition"
            >
              {/* Google icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.5 0 19.5-8.1 19.5-19.5 0-1.3-.1-2.2-.3-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.9 16.1 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.6-5.2l-6.3-5.2c-2.1 1.9-4.8 3-7.7 3-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.1 39.5 16 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.5-5.2 6-9.3 6-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-11.1 0-20 8.9-20 20s8.9 20 20 20c11.5 0 19.5-8.1 19.5-19.5 0-1.3-.1-2.2-.3-4z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-2 text-xs text-white/60 backdrop-blur">or with email</span>
            </div>
          </div>

          {/* Steps */}
          <div className="min-h-[220px]">
            {tab === "signup"
              ? steps[stepIdx]
              : (
                // Login tab: reuse Email → Password only
                stepIdx === 0 ? (
                  <EmailStep
                    mode="login"
                    value={state.email}
                    onNext={(email) => {
                      setState((s) => ({ ...s, email }));
                      setStepIdx(1);
                    }}
                    onGoogle={() => signIn("google")}
                  />
                ) : (
                  steps[1] /* Password step uses handleLoginPasswordNext */
                )
              )
            }
          </div>

          {/* Footer / error */}
          {!!err && <p className="mt-4 text-sm text-red-300">{err}</p>}
          {busy && <p className="mt-4 text-sm text-white/70">Working…</p>}
        </div>
      </div>
    </div>
  );
}
