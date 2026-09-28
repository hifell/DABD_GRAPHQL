import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Mail, Lock, MapPin, FileText, Upload } from "lucide-react";
import { REGISTER_COMPANY, graphqlMutation } from "../services/graphql";
import type { RegisterCompanyResponse } from "../services/graphql";

export default function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaPerusahaan: "",
    email: "",
    password: "",
    alamat: "",
    deskripsi: "",
    logo: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await graphqlMutation<RegisterCompanyResponse>(REGISTER_COMPANY, {
        input: {
          companyName: formData.namaPerusahaan,
          email: formData.email,
          password: formData.password,
          address: formData.alamat,
          description: formData.deskripsi,
        }
      });

      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi perusahaan gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <span className="font-bold text-3xl text-[var(--coral)]">KerjoLe!</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Daftar Sebagai Perusahaan</h1>
          <p className="text-muted-foreground">Mulai rekrut talenta terbaik untuk perusahaan Anda</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Perusahaan</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.namaPerusahaan}
                  onChange={(e) => setFormData({ ...formData, namaPerusahaan: e.target.value })}
                  placeholder="PT. Nama Perusahaan"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Perusahaan</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@perusahaan.com"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Alamat</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Alamat lengkap perusahaan"
                  rows={3}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deskripsi Perusahaan</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Ceritakan tentang perusahaan Anda..."
                  rows={4}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Logo Perusahaan</label>
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-[var(--coral)] transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {formData.logo ? formData.logo.name : "Klik untuk upload logo (PNG, JPG)"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-block px-6 py-2 bg-[var(--coral)] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[var(--coral-light)] transition-colors"
                >
                  Pilih File
                </label>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] transition-all hover:shadow-lg disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[var(--coral)] hover:underline font-medium">
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
