"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  History,
  LayoutDashboard,
  Bell,
  Download,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/auth/UserMenu";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function useNavItems(): NavItem[] {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const items: NavItem[] = [];

  if (role !== "it_admin") {
    items.push({ href: "/bookings", label: "Reservas", icon: CalendarDays });
  }
  items.push({ href: "/how-to-use", label: "Guía de Uso", icon: BookOpen });
  items.push({ href: "/activity", label: "Actividad", icon: History });

  if (role === "conserje") {
    items.push({ href: "/notifications", label: "Notificaciones", icon: Bell });
  }
  if (role === "it_admin") {
    items.push({ href: "/admin", label: "Administración", icon: LayoutDashboard });
  }
  if (role === "admin" || role === "conserje") {
    items.push({ href: "/admin/export", label: "Exportar", icon: Download });
  }

  return items;
}

function NavLink({
  href,
  label,
  icon: Icon,
  compact = false,
}: NavItem & { compact?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        compact ? "px-3 py-2" : "px-2.5 py-1.5"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function AppHeader() {
  const items = useNavItems();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <Image
            src="/icon-192x192.png"
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-lg"
          />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Sociedad Roncesvalles
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 md:flex">
          {items.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div>
      </div>

      <nav className="mx-auto flex max-w-[1180px] items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {items.map((item) => (
          <NavLink key={item.href} {...item} compact />
        ))}
      </nav>
    </header>
  );
}
