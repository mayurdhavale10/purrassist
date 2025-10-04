import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = "force-dynamic"; // avoid static prerender/export issues

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading reset form…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
