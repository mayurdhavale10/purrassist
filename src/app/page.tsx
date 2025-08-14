"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      {!session ? (
        <>
          <h1>Omegle Clone</h1>
          <button onClick={() => signIn("google")}>Sign in with Google</button>
        </>
      ) : (
        <>
          <h1>Welcome, {session.user?.name}</h1>
          <p>Email: {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
          <a href="/video">Go to Video Chat</a>
        </>
      )}
    </div>
  );
}
