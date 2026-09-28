import { useEffect, useState } from "react";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Eye, Plus, XCircle } from "lucide-react";
import { GET_MY_COMPANY_JOBS, CLOSE_JOB, graphqlRequest, graphqlMutation } from "../services/graphql";

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await graphqlRequest<any>(GET_MY_COMPANY_JOBS);
      setJobs(res.myCompanyJobs.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat lowongan");
    }
  };

  useEffect(() => { load(); }, []);

  const closeJob = async (id: number) => {
    try {
      await graphqlMutation<any>(CLOSE_JOB, { jobId: id });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menutup lowongan");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div><h1 className="text-4xl font-bold mb-2">Kelola Lowongan</h1><p className="text-muted-foreground">CRUD lowongan milik perusahaan login.</p></div>
            <Link to="/perusahaan/tambah-lowongan" className="px-5 py-3 bg-[var(--coral)] text-white rounded-2xl flex gap-2 items-center"><Plus className="w-4 h-4" /> Tambah</Link>
          </div>
          {error && <p className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</p>}
          <div className="bg-white rounded-3xl p-6 border overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b"><th className="py-3">Judul</th><th>Lokasi</th><th>Status</th><th>Validasi</th><th>Pelamar</th><th>Aksi</th></tr></thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className="border-b last:border-0">
                    <td className="py-4 font-semibold">{job.jobTitle}</td><td>{job.location}</td><td>{job.status}</td><td>{job.isValidated ? "Valid" : "Pending"}</td><td>{job.totalApplicants}</td>
                    <td className="flex gap-3 py-4">
                      <Link to={`/perusahaan/lowongan/${job.id}/pelamar`} className="text-[var(--coral)] flex gap-1 items-center"><Eye className="w-4 h-4" /> Kandidat</Link>
                      {job.status !== "closed" && <button onClick={() => closeJob(job.id)} className="text-red-600 flex gap-1 items-center"><XCircle className="w-4 h-4" /> Tutup</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
