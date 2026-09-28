import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Briefcase, Clock, Eye, Plus, Users } from "lucide-react";
import { GET_MY_COMPANY_JOBS, graphqlRequest, clearAuth } from "../services/graphql";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await graphqlRequest<any>(GET_MY_COMPANY_JOBS);
      setCompany(res.myCompanyJobs.company);
      setJobs(res.myCompanyJobs.jobs);
    } catch (err) {
      clearAuth();
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <><Navbar /><div className="min-h-screen p-10">Memuat dashboard perusahaan...</div></>;

  const activeJobs = jobs.filter(j => j.status === "published").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.totalApplicants || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard Perusahaan</h1>
              <p className="text-muted-foreground text-lg">Halo, <b>{company?.companyName}</b></p>
              <p className="text-sm text-muted-foreground">Data lowongan dan pelamar.</p>
            </div>
            <Link to="/perusahaan/tambah-lowongan" className="px-6 py-3 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Lowongan</Link>
          </div>

          {company && !company.isValidated && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl px-5 py-4">
              Akun perusahaan belum divalidasi admin. Sesuai SRS, perusahaan belum bisa membuat lowongan sampai admin melakukan validasi.
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 border"><Briefcase className="w-7 h-7 text-[var(--coral)] mb-3" /><p className="text-3xl font-bold">{jobs.length}</p><p className="text-muted-foreground">Total Lowongan</p></div>
            <div className="bg-white rounded-3xl p-6 border"><Clock className="w-7 h-7 text-green-600 mb-3" /><p className="text-3xl font-bold">{activeJobs}</p><p className="text-muted-foreground">Lowongan Aktif</p></div>
            <div className="bg-white rounded-3xl p-6 border"><Users className="w-7 h-7 text-blue-600 mb-3" /><p className="text-3xl font-bold">{totalApplicants}</p><p className="text-muted-foreground">Total Pelamar</p></div>
          </div>

          <section className="bg-white rounded-3xl p-6 border">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold">Lowongan Perusahaan Saya</h2>
              <Link to="/perusahaan/kelola-lowongan" className="text-[var(--coral)] font-semibold">Kelola Semua</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b"><th className="py-3">Judul</th><th>Status</th><th>Validasi</th><th>Pelamar</th><th>Aksi</th></tr></thead>
                <tbody>
                  {jobs.length === 0 && <tr><td colSpan={5} className="py-6 text-muted-foreground">Belum ada lowongan.</td></tr>}
                  {jobs.map(job => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-4 font-semibold">{job.jobTitle}</td>
                      <td><span className="px-3 py-1 rounded-full bg-gray-100 text-sm">{job.status}</span></td>
                      <td>{job.isValidated ? "Valid" : "Menunggu Admin"}</td>
                      <td>{job.totalApplicants}</td>
                      <td><Link to={`/perusahaan/lowongan/${job.id}/pelamar`} className="inline-flex items-center gap-1 text-[var(--coral)]"><Eye className="w-4 h-4" /> Kandidat</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
