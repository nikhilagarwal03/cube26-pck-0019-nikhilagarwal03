export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <section className="min-h-screen bg-zinc-950 text-zinc-100">{children}</section>;
}