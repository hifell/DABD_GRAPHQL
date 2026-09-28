import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, LayoutDashboard } from "lucide-react";
import { ME, clearAuth, graphqlRequest } from "../services/graphql";
import { Button } from "./ui/button";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    graphqlRequest<any>(ME)
      .then(res => setMe(res.me))
      .catch(() => {
        clearAuth();
        navigate("/login");
      });
  }, [navigate]);

  const logout = () => {
    clearAuth();
    setMe(null);
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="font-bold text-2xl text-[var(--coral)]">KerjoLe!</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-100 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-foreground">Admin Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden sm:block text-right px-4 py-2 rounded-2xl bg-gradient-to-r from-[var(--coral)]/10 to-[var(--peach)]/10 border border-[var(--coral)]/20">
                <p className="text-sm font-medium text-[var(--coral)]">{me.fullName}</p>
                <p className="text-xs text-[var(--peach)] capitalize">{me.role}</p>
              </div>
            )}
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
