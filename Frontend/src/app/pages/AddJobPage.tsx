import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowLeft } from "lucide-react";
import { GET_SKILLS, CREATE_JOB, graphqlRequest, graphqlMutation } from "../services/graphql";

export default function AddJobPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ jobTitle: "", jobDescription: "", jobQualification: "", location: "", salaryMin: "", salaryMax: "", jobType: "Full-Time", status: "published" as string });
  const [selectedSkills, setSelectedSkills] = useState<{skillId: number, minimumLevel: number}[]>([]);
  const [skillId, setSkillId] = useState("");
  const [minimumLevel, setMinimumLevel] = useState(3);

  useEffect(() => {
    graphqlRequest<any>(GET_SKILLS)
      .then(res => setSkills(res.skills || []))
      .catch(err => setError(err.message));
  }, []);

  const handleAddSkill = () => {
    if (!skillId) return;
    if (selectedSkills.some(s => s.skillId === Number(skillId))) return;
    setSelectedSkills([...selectedSkills, { skillId: Number(skillId), minimumLevel }]);
    setSkillId("");
    setMinimumLevel(3);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (selectedSkills.length === 0) return setError("Lowongan wajib memiliki minimal 1 skill sesuai SRS/FSD.");
    setLoading(true);
    try {
      await graphqlMutation<any>(CREATE_JOB, {
        input: {
          jobTitle: form.jobTitle,
          jobDescription: form.jobDescription,
          jobQualification: form.jobQualification,
          location: form.location,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          jobType: form.jobType,
          status: form.status,
          expiredDate: null,
          requiredSkills: selectedSkills,
        }
      });
      navigate("/perusahaan/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat lowongan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <Link to="/perusahaan/dashboard" className="inline-flex items-center gap-2 text-[var(--coral)] font-semibold mb-6"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="bg-white rounded-3xl p-8 border">
            <h1 className="text-3xl font-bold mb-2">Tambah Lowongan</h1>
            <p className="text-muted-foreground mb-8">Tambahkan lowongan pekerjaan baru.</p>
            {error && <p className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</p>}
            <form onSubmit={submit} className="space-y-5">
              <input required placeholder="Judul Pekerjaan" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} className="w-full px-4 py-3 rounded-2xl border" />
              <textarea required placeholder="Deskripsi Pekerjaan" rows={4} value={form.jobDescription} onChange={e => setForm({ ...form, jobDescription: e.target.value })} className="w-full px-4 py-3 rounded-2xl border" />
              <textarea required placeholder="Kualifikasi" rows={4} value={form.jobQualification} onChange={e => setForm({ ...form, jobQualification: e.target.value })} className="w-full px-4 py-3 rounded-2xl border" />
              <div className="grid md:grid-cols-2 gap-4">
                <input required placeholder="Lokasi" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-4 py-3 rounded-2xl border" />
                <select value={form.jobType} onChange={e => setForm({ ...form, jobType: e.target.value })} className="px-4 py-3 rounded-2xl border bg-white"><option>Full-Time</option><option>Part-Time</option><option>Hybrid</option><option>Remote</option><option>Freelance</option></select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input type="number" placeholder="Gaji Minimum" value={form.salaryMin} onChange={e => setForm({ ...form, salaryMin: e.target.value })} className="px-4 py-3 rounded-2xl border" />
                <input type="number" placeholder="Gaji Maksimum" value={form.salaryMax} onChange={e => setForm({ ...form, salaryMax: e.target.value })} className="px-4 py-3 rounded-2xl border" />
              </div>
              <div className="space-y-4">
                <label className="block font-semibold">Requirement Skills</label>
                <div className="flex gap-4 items-center">
                  <select value={skillId} onChange={e => setSkillId(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl border bg-white"><option value="">Pilih Skill</option>{skills.map(s => <option key={s.id} value={s.id}>{s.skillName}</option>)}</select>
                  <select value={minimumLevel} onChange={e => setMinimumLevel(Number(e.target.value))} className="w-40 px-4 py-3 rounded-2xl border bg-white">{[1,2,3,4,5].map(n => <option key={n} value={n}>Min Level {n}</option>)}</select>
                  <button type="button" onClick={handleAddSkill} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200">Tambah</button>
                </div>

                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedSkills.map(sk => {
                      const skillObj = skills.find(s => s.id === sk.skillId);
                      return (
                        <div key={sk.skillId} className="inline-flex items-center gap-2 bg-[var(--coral)]/10 text-[var(--coral)] px-4 py-2 rounded-full font-medium">
                          <span>{skillObj?.skillName} (Lv.{sk.minimumLevel})</span>
                          <button type="button" onClick={() => setSelectedSkills(selectedSkills.filter(s => s.skillId !== sk.skillId))} className="w-5 h-5 rounded-full hover:bg-[var(--coral)] hover:text-white flex items-center justify-center transition-colors">
                            &times;
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <button disabled={loading} className="w-full px-8 py-4 bg-[var(--coral)] text-white rounded-2xl font-semibold disabled:opacity-60">{loading ? "Menyimpan..." : "Simpan Lowongan"}</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
