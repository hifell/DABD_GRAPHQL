import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Upload } from "lucide-react";
import { REGISTER_USER, LOGIN, setAuth, graphqlMutation, graphqlRequest } from "../services/graphql";
import type { RegisterUserResponse, LoginResponse } from "../services/graphql";

export default function JobSeekerRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    alamat: "",
    noHp: "",
    pendidikan: "",
    ktp: null as File | null,
    cv: null as File | null
  });

  const handleNext = () => {
    setError("");

    if (step === 1) {
      if (!formData.nama.trim()) {
        setError("Nama lengkap wajib diisi");
        return;
      }

      if (!formData.email.trim()) {
        setError("Email wajib diisi");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.email)) {
        setError("Format email tidak valid");
        return;
      }

      if (formData.password.length < 8) {
        setError("Password minimal 8 karakter");
        return;
      }
    }

    if (step === 2) {
      if (!formData.alamat.trim()) {
        setError("Alamat wajib diisi");
        return;
      }

      if (!formData.noHp.trim()) {
        setError("Nomor HP wajib diisi");
        return;
      }

      if (!formData.pendidikan.trim()) {
        setError("Pendidikan terakhir wajib dipilih");
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.nama.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      await graphqlMutation<RegisterUserResponse>(REGISTER_USER, {
        input: {
          fullName: formData.nama,
          email: formData.email,
          password: formData.password,
        }
      });

      const login = await graphqlMutation<LoginResponse>(LOGIN, {
        input: { email: formData.email, password: formData.password }
      });

      setAuth(login.login.accessToken, login.login.role);

      alert("Registrasi berhasil!");

      navigate("/pelamar/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
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
          <h1 className="text-3xl font-bold mb-2">Daftar Sebagai Pelamar</h1>
          <p className="text-muted-foreground">Lengkapi data diri Anda untuk mulai melamar pekerjaan</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex-1 flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= num
                        ? "bg-[var(--coral)] text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step > num ? <CheckCircle2 className="w-6 h-6" /> : num}
                  </div>
                  {num < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        step > num ? "bg-[var(--coral)]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Data Akun</span>
              <span>Data Diri</span>
              <span>Dokumen</span>
              <span>Review</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Step 1: Data Akun</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Data Diri</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Alamat lengkap"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">No HP</label>
                <input
                  type="tel"
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pendidikan Terakhir</label>
                <select
                  value={formData.pendidikan}
                  onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-background)] border border-border focus:border-[var(--coral)] outline-none transition-colors"
                >
                  <option value="">Pilih pendidikan</option>
                  <option>SMA/SMK</option>
                  <option>D3</option>
                  <option>S1</option>
                  <option>S2</option>
                  <option>S3</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Step 3: Upload Dokumen</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Upload KTP</label>
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-[var(--coral)] transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {formData.ktp ? formData.ktp.name : "Klik untuk upload KTP (JPG, PNG, PDF)"}
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFormData({ ...formData, ktp: e.target.files?.[0] || null })}
                    className="hidden"
                    id="ktp-upload"
                  />
                  <label
                    htmlFor="ktp-upload"
                    className="inline-block px-6 py-2 bg-[var(--coral)] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[var(--coral-light)] transition-colors"
                  >
                    Pilih File
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload CV</label>
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-[var(--coral)] transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {formData.cv ? formData.cv.name : "Klik untuk upload CV (PDF)"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({ ...formData, cv: e.target.files?.[0] || null })}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="inline-block px-6 py-2 bg-[var(--coral)] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[var(--coral-light)] transition-colors"
                  >
                    Pilih File
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Step 4: Review Data</h2>
              <div className="bg-[var(--input-background)] rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">{formData.nama || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{formData.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No HP</p>
                  <p className="font-medium">{formData.noHp || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendidikan</p>
                  <p className="font-medium">{formData.pendidikan || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dokumen</p>
                  <p className="font-medium">
                    KTP: {formData.ktp ? "✓ Uploaded" : "✗ Not uploaded"}<br />
                    CV: {formData.cv ? "✓ Uploaded" : "✗ Not uploaded"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border-2 border-border rounded-2xl hover:border-[var(--coral)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] transition-all hover:shadow-lg"
              >
                Selanjutnya
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] transition-all hover:shadow-lg disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
