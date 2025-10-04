"use client";

type Props = {
  email: string;
  onFinish: () => void;
};

export default function SuccessStep({ email, onFinish }: Props) {
  return (
    <div className="text-center text-white">
      <p className="text-lg font-semibold">You're all set 🎉</p>
      <p className="mt-2 text-white/80 text-sm">
        We’ve created your account for <span className="font-medium">{email}</span>.
        If verification is required, you’ll be notified soon.
      </p>
      <button
        onClick={onFinish}
        className="mt-6 w-full rounded-xl bg-white/20 hover:bg-white/30 text-white py-2"
      >
        Continue
      </button>
    </div>
  );
}
