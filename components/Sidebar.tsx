"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "tools", label: "Tools", icon: "🧰", path: "/tools" },
  { id: "recent", label: "Recent", icon: "🕒", path: "/recent" },
  { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  const userInitials = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="w-64 border-r border-white/8 p-5 hidden md:flex flex-col shrink-0">
      {/* Logo */}
      <div className="text-xl font-bold mb-8 px-2">⚡ LaunchPad</div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              pathname === item.path
                ? "bg-white/10 text-white font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Upgrade CTA */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20">
        <div className="text-sm font-medium mb-1">Go Pro</div>
        <p className="text-xs text-slate-400 mb-3">Unlock unlimited tools and AI features.</p>
        <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition">
          Upgrade — ₦2,500/mo
        </button>
      </div>

      {/* User */}
      <div className="mt-auto pt-5 border-t border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-white transition text-xs shrink-0"
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  )
}