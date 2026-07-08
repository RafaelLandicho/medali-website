"use client";

import {
  LogOut,
  Home,
  Users,
  BarChart3,
  FileText,
  UserCircle,
  Shield,
  Menu,
  X,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/auth/authprovider";
import { useNavigate, useLocation } from "react-router-dom";

import React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Records", icon: FileText, path: "/records", cantSeeAdmin: true },
  {
    label: "Pending",
    icon: Clock,
    path: "/pending",
    doctorOnly: true,
    cantSeeAdmin: true,
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    cantSeeAdmin: true,
  },
  { label: "Medical Staff", icon: Users, path: "/users" },
  { label: "Admin", icon: Shield, path: "/logs", adminOnly: true },
];

const NavItem = ({
  item,
  isActive,
}: {
  item: (typeof NAV_ITEMS)[0];
  isActive: boolean;
}) => {
  const navigate = useNavigate();
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={`
        inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
        whitespace-nowrap transition-all duration-150
        ${
          isActive
            ? "bg-white text-[#00a896]"
            : "text-white/90 hover:bg-white/15 hover:text-white"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {item.label}
    </button>
  );
};

export default function HeaderPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.type?.toLowerCase() === "admin";
  const isDoctor = user?.type?.toLowerCase() === "doctor";
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.path === location.pathname;

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.doctorOnly && !isDoctor) return false;
    if (item.cantSeeAdmin && isAdmin) return false;
    return true;
  });

  return (
    <header className="w-full bg-[#1a1a2e] text-white shadow-lg sticky top-0 z-50 overflow-x-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-2">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          onClick={() => navigate("/")}
        >
          <div className="bg-[#00a896] text-white w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0">
            🩺
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white truncate">
              meda<span className="text-[#00c4b4]">li</span>
            </h1>
            <p className="text-[10px] text-white/50 tracking-wide leading-none mt-0.5 truncate">
              Medical Records Platform
            </p>
          </div>
        </div>

        {/* Desktop nav — CSS-driven, no JS flash */}
        <nav className="hidden md:flex items-center gap-0.5 min-w-0">
          {visibleNavItems.map((item) => (
            <NavItem key={item.label} item={item} isActive={isActive(item)} />
          ))}
        </nav>

        {/* Right: user area + mobile hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Avatar className="w-8 h-8 border-2 border-[#00a896] shrink-0">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName}${user?.lastName}`}
                  />
                  <AvatarFallback className="bg-[#00a896] text-white text-xs font-bold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold leading-none text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-none">
                    {user?.type?.toUpperCase()}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 hidden md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.type?.toUpperCase()}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate(`/profile/${user?.uid}`)}
                className="mt-1"
              >
                <UserCircle className="w-4 h-4 mr-2 text-gray-400" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-500 focus:text-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hamburger — CSS-driven, mirrors nav breakpoint */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1a1a2e] px-4 pb-4 pt-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium my-0.5
                  transition-colors
                  ${
                    active
                      ? "bg-[#00a896]/20 text-[#00a896]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
