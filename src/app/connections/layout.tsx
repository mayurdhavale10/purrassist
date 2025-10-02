// src/app/connections/layout.tsx
"use client";

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-72px)] grid grid-cols-12">
      <aside className="col-span-3 border-r hidden lg:block" />
      <main className="col-span-12 lg:col-span-6">{children}</main>
      <aside className="col-span-3 border-l hidden lg:block" />
    </div>
  );
}
