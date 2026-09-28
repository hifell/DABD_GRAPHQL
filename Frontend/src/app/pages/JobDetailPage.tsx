import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowLeft, Building, MapPin } from "lucide-react";
import { GET_JOB, APPLY_JOB, graphqlRequest, graphqlMutation, getDashboardPath, getToken } from "../services/graphql";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    graphqlRequest<any>(GET_JOB, { id: parseInt(id) })
      .then(res => setJob(res.job))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const apply = async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setError("");
    setMessage("");
    try {
      const res = await graphqlMutation<any>(APPLY_JOB, { jobId: parseInt(id!) });
      setMessage(`${res.applyJob.message}. Matching score kamu: ${Math.round(res.applyJob.matchingScore)}%`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melamar");
    }
  };

  if (loading) return <><Navbar /><div className="min-h-screen p-10">Memuat detail lowongan...</div></>;
  if (!job) return <><Navbar /><div className="min-h-screen p-10">Lowongan tidak ditemukan.</div></>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link to="/lowongan" className="inline-flex items-center gap-2 text-[var(--coral)] font-semibold"><ArrowLeft className="w-4 h-4" /> Kembali</Link>
          <div className="bg-white rounded-3xl p-8 border">
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold mb-3">{job.jobTitle}</h1>
                <p className="flex items-center gap-2 text-muted-foreground mb-2"><Building className="w-4 h-4" /> {job.companyName}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {job.location}</p>
              </div>
              <button onClick={apply} className="self-start px-8 py-4 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)]">Lamar Sekarang</button>
            </div>
            {message && <p className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl">{message}</p>}
            {error && <p className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</p>}
          </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            <div className="bg-white rounded-3xl p-8 border space-y-6">
              <section><h2 className="text-2xl font-bold mb-3">Deskripsi Pekerjaan</h2><p className="whitespace-pre-line text-muted-foreground leading-7">{job.jobDescription}</p></section>
              <section><h2 className="text-2xl font-bold mb-3">Kualifikasi</h2><p className="whitespace-pre-line text-muted-foreground leading-7">{job.jobQualification}</p></section>
            </div>
            <aside className="bg-white rounded-3xl p-8 border h-fit">
              <h2 className="text-xl font-bold mb-4">Skill Dibutuhkan</h2>
              <div className="space-y-3">
                {job.requiredSkills.map((skill: any) => <div key={skill.id} className="p-3 rounded-2xl bg-gray-50 border"><p className="font-semibold">{skill.skillName}</p><p className="text-sm text-muted-foreground">Minimum level {skill.minimumLevel}/5</p></div>)}
              </div>
              <button onClick={() => navigate(getDashboardPath())} className="w-full mt-6 px-4 py-3 border rounded-2xl font-semibold hover:border-[var(--coral)]">Lihat Dashboard Saya</button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
