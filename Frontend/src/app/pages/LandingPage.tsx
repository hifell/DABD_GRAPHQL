import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Search, TrendingUp, Briefcase, Users, Building2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GET_JOBS, graphqlRequest } from "../services/graphql";
import type { JobType, GetJobsResponse } from "../services/graphql";

export default function LandingPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const trendingTags = [
    "Data Engineer",
    "Software Engineer",
    "UI/UX Designer",
    "Data scientist",
    "Data Analyst"
  ];

  const loadFeaturedJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await graphqlRequest<{ jobs: JobType[] }>(GET_JOBS, { limit: 3 });
      setFeaturedJobs(result.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat lowongan");
      setFeaturedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedJobs();
  }, []);

  const handleSearch = () => {
    const keyword = searchQuery.trim();

    if (!keyword) {
      navigate("/lowongan");
      return;
    }

    navigate(`/lowongan?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleTrendingClick = (tag: string) => {
    navigate(`/lowongan?keyword=${encodeURIComponent(tag)}`);
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${(min / 1000000).toFixed(0)}jt - ${(max / 1000000).toFixed(0)}jt`;
    }

    if (min) {
      return `Mulai ${(min / 1000000).toFixed(0)}jt`;
    }

    if (max) {
      return `Sampai ${(max / 1000000).toFixed(0)}jt`;
    }

    return "Tidak dicantumkan";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Temukan pekerjaan impian anda di{" "}
            <span className="text-[var(--coral)]">KerjoLe!</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Platform terpercaya untuk menghubungkan talenta terbaik dengan perusahaan impian
          </p>

          <div className="relative max-w-3xl mx-auto">
            <div className="relative flex items-center bg-white rounded-3xl shadow-2xl p-2 border-2 border-border hover:border-[var(--coral)] transition-all">
              <Search className="absolute left-6 w-6 h-6 text-muted-foreground" />

              <input
                type="text"
                placeholder="Jenis pekerjaan / perusahaan yang anda cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="flex-1 px-14 py-4 bg-transparent outline-none text-lg"
              />

              <button
                type="button"
                onClick={handleSearch}
                className="px-8 py-4 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] transition-all hover:shadow-lg"
              >
                Cari
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <TrendingUp className="w-5 h-5 text-[var(--coral)]" />
            <span className="text-sm text-muted-foreground">Trending:</span>

            {trendingTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTrendingClick(tag)}
                className="px-4 py-2 bg-white rounded-full text-sm hover:bg-[var(--coral)] hover:text-white transition-all shadow-sm border border-border"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lowongan Terverifikasi</h3>
              <p className="text-muted-foreground">
                Akses lowongan pekerjaan yang sudah divalidasi admin dari perusahaan terpercaya.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--peach)] to-[var(--pink)] flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Skill-Based Matching</h3>
              <p className="text-muted-foreground">
                Lamar pekerjaan berdasarkan kompetensi, hard skill, project, dan sertifikat.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--pink)] to-[var(--coral)] flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Perusahaan Terpercaya</h3>
              <p className="text-muted-foreground">
                Perusahaan dapat mengelola lowongan dan melihat ranking kandidat berdasarkan skor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Lowongan Pilihan</h2>
            <p className="text-muted-foreground text-lg">
              Posisi terbaru yang diambil langsung dari sistem KerjoLe
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                Memuat lowongan...
              </div>
            ) : featuredJobs.length > 0 ? (
              featuredJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/lowongan/${job.id}`}
                  className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center text-2xl">
                      💼
                    </div>

                    <span className="px-3 py-1 bg-[var(--yellow-light)] text-[var(--coral)] rounded-full text-sm font-medium">
                      {job.jobType}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{job.jobTitle}</h3>

                  <p className="text-muted-foreground text-sm mb-2">
                    {job.companyName}
                  </p>

                  <p className="text-muted-foreground text-sm mb-3">
                    {job.location}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills?.slice(0, 3).map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 rounded-full bg-gray-100 text-xs"
                      >
                        {skill.skillName} L{skill.minimumLevel}
                      </span>
                    ))}
                  </div>

                  <p className="text-[var(--coral)] font-semibold">
                    Gaji: {formatSalary(job.salaryMin, job.salaryMax)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                Belum ada lowongan tersedia
              </div>
            )}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/lowongan"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--coral)] text-white rounded-2xl font-semibold hover:bg-[var(--coral-light)] transition-all hover:shadow-lg"
            >
              Lihat Semua Lowongan
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}