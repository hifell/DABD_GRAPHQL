import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User } from "lucide-react";
import { LOGIN, setAuth, getDashboardPath, graphqlMutation } from "../services/graphql";
import type { LoginResponse } from "../services/graphql";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await graphqlMutation<LoginResponse>(LOGIN, {
        input: { email, password }
      });
      const { accessToken, role } = result.login;
      setAuth(accessToken, role);
      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center"><span className="text-white font-bold text-2xl">K</span></div>
            <span className="font-bold text-3xl text-[var(--coral)]">KerjoLe!</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Selamat Datang Kembali</h1>
          <p className="text-muted-foreground">Masuk memakai akun dari backend</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@kerjole.com" required className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="user12345" required className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-8 py-4 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] disabled:opacity-60">{loading ? "Memproses..." : "Login"}</button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center space-y-3">
            <p className="text-muted-foreground text-sm">Belum punya akun?</p>
            <div className="flex gap-3">
              <Link to="/register/pelamar" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-border rounded-2xl hover:border-[var(--coral)]"><User className="w-4 h-4" /><span className="text-sm font-medium">Pelamar</span></Link>
              <Link to="/register/perusahaan" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-border rounded-2xl hover:border-[var(--coral)]"><User className="w-4 h-4" /><span className="text-sm font-medium">Perusahaan</span></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
