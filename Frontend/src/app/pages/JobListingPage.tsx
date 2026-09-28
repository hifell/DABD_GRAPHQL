import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { MapPin, Search } from "lucide-react";
import { GET_JOBS, graphqlRequest } from "../services/graphql";

const salary = (job: any) => {
  if (!job.salaryMin && !job.salaryMax) return "Tidak ditampilkan";

  return `Rp${Number(job.salaryMin || 0).toLocaleString("id-ID")} - Rp${Number(
    job.salaryMax || 0
  ).toLocaleString("id-ID")}`;
};

export default function JobListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keywordFromUrl = searchParams.get("keyword") || "";

  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState(keywordFromUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = async (keyword?: string) => {
    try {
      setLoading(true);
      setError("");

      const result = await graphqlRequest<any>(GET_JOBS, {
        keyword: keyword?.trim() || undefined,
      });

      setJobs(result.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat lowongan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(keywordFromUrl);
    loadJobs(keywordFromUrl);
  }, [keywordFromUrl]);

  const handleSearch = () => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSearchParams({});
      loadJobs();
      return;
    }

    setSearchParams({ keyword: cleanQuery });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Daftar Lowongan</h1>

          <p className="text-muted-foreground mb-8">
            Data lowongan diambil langsung dari backend dan dapat dicari berdasarkan posisi,
            perusahaan, deskripsi, atau kualifikasi.
          </p>

          <div className="relative mb-4 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Cari posisi, perusahaan, lokasi..."
              className="w-full pl-12 pr-28 py-4 rounded-2xl border bg-white outline-none focus:border-[var(--coral)]"
            />

            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[var(--coral)] text-white rounded-xl font-semibold hover:bg-[var(--coral-light)]"
            >
              Cari
            </button>
          </div>

          {keywordFromUrl && (
            <p className="mb-8 text-sm text-muted-foreground">
              Hasil pencarian untuk:{" "}
              <span className="font-semibold text-[var(--coral)]">
                {keywordFromUrl}
              </span>
            </p>
          )}

          {loading && <p>Memuat lowongan...</p>}

          {error && (
            <p className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </p>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="bg-white rounded-3xl p-8 border text-muted-foreground">
              Tidak ada lowongan yang cocok dengan pencarian.
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/lowongan/${job.id}`}
                className="bg-white rounded-3xl p-6 border hover:shadow-lg transition-all"
              >
                <div className="flex justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{job.jobTitle}</h2>
                    <p className="text-muted-foreground">{job.companyName}</p>
                  </div>

                  <span className="text-3xl">💼</span>
                </div>

                <p className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </p>

                <p className="font-semibold text-[var(--coral)] mb-4">
                  {salary(job)}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.requiredSkills?.map((skill: any) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 rounded-full bg-gray-100 text-sm"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>

                <span className="inline-block px-4 py-2 rounded-xl bg-[var(--coral)] text-white font-semibold">
                  Lihat Detail
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}