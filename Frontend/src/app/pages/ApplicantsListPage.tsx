import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GET_CANDIDATES, UPDATE_APPLICATION_STATUS, graphqlRequest, graphqlMutation } from "../services/graphql";

type SelectionStatus = "accepted" | "rejected";

export default function ApplicantsListPage() {
  const { id } = useParams();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = async () => {
    if (!id) return;

    try {
      setError("");
      const res = await graphqlRequest<any>(GET_CANDIDATES, { jobId: parseInt(id) });
      setCandidates(res.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kandidat");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const update = async (appId: number, status: SelectionStatus) => {
    try {
      setError("");
      setUpdatingId(appId);

      await graphqlMutation<any>(UPDATE_APPLICATION_STATUS, { applicationId: appId, status });

      alert(
        status === "accepted"
          ? "Pelamar berhasil diterima"
          : "Pelamar berhasil ditolak"
      );

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update status pelamar");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "accepted") return "Diterima";
    if (status === "rejected") return "Ditolak";
    return "Pending";
  };

  const getStatusClass = (status: string) => {
    if (status === "accepted") return "text-green-700 bg-green-100";
    if (status === "rejected") return "text-red-700 bg-red-100";
    return "text-yellow-700 bg-yellow-100";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/perusahaan/dashboard"
            className="text-[var(--coral)] font-semibold"
          >
            ← Dashboard
          </Link>

          <h1 className="text-4xl font-bold mt-4 mb-2">Kandidat Pelamar</h1>

          <p className="text-muted-foreground mb-8">
            Diurutkan dari matching score tertinggi.
          </p>

          {error && (
            <p className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </p>
          )}

          <div className="space-y-4">
            {candidates.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border text-muted-foreground">
                Belum ada pelamar untuk lowongan ini.
              </div>
            )}

            {candidates.map((c) => {
              const isUpdating = updatingId === c.id;
              const isFinished = c.status === "accepted" || c.status === "rejected";

              return (
                <div key={c.id} className="bg-white rounded-3xl p-6 border">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold">{c.applicantName}</h2>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                            c.status
                          )}`}
                        >
                          {getStatusLabel(c.status)}
                        </span>
                      </div>

                      <p className="text-muted-foreground">{c.applicantEmail}</p>

                      <p className="mt-3">
                        Score: <b>{Math.round(c.matchingScore)}%</b>
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {c.skills?.map((s: any, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-gray-100 text-sm"
                          >
                            {s.skillName} L{s.level}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/perusahaan/pelamar/${c.id}`}
                        className="px-4 py-2 rounded-xl bg-[var(--coral)] text-white"
                      >
                        Detail
                      </Link>

                      <button
                        type="button"
                        disabled={isUpdating || isFinished}
                        onClick={() => update(c.id, "accepted")}
                        className={`px-4 py-2 rounded-xl text-white ${isUpdating || isFinished
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                          }`}
                      >
                        {isUpdating ? "Memproses..." : "Terima"}
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating || isFinished}
                        onClick={() => update(c.id, "rejected")}
                        className={`px-4 py-2 rounded-xl text-white ${isUpdating || isFinished
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                          }`}
                      >
                        {isUpdating ? "Memproses..." : "Tolak"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    Status saat ini: {getStatusLabel(c.status)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}