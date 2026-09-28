import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, LogOut } from "lucide-react";
import { ME, clearAuth, getDashboardPath, isLoggedIn, graphqlRequest } from "../services/graphql";
import type { MeResponse, UserType } from "../services/graphql";

export default function Navbar() {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserType | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    graphqlRequest<MeResponse>(ME).then(res => setMe(res.me)).catch(() => {
      clearAuth();
      setMe(null);
    });
  }, []);

  const logout = () => {
    clearAuth();
    setMe(null);
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="font-bold text-2xl text-[var(--coral)]">KerjoLe!</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-[var(--coral)] transition-colors">Home</Link>
            <Link to="/lowongan" className="text-foreground hover:text-[var(--coral)] transition-colors">Lowongan</Link>
            {me?.role === "COMPANY" && <Link to="/perusahaan/dashboard" className="text-foreground hover:text-[var(--coral)] transition-colors">Dashboard Perusahaan</Link>}
            {me?.role === "USER" && <Link to="/pelamar/dashboard" className="text-foreground hover:text-[var(--coral)] transition-colors">Dashboard Pelamar</Link>}
          </div>

          {me ? (
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(getDashboardPath(me.role))} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--input-background)] hover:bg-gray-100">
                <User className="w-4 h-4" />
                <span className="font-medium max-w-40 truncate">{me.fullName}</span>
              </button>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-border hover:border-[var(--coral)]">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[var(--coral)] text-white hover:bg-[var(--coral-light)] transition-all hover:shadow-lg">
              <User className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
