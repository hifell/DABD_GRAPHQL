import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GET_APPLICATION_DETAIL, UPDATE_APPLICATION_STATUS, graphqlRequest, graphqlMutation } from "../services/graphql";
import { User, Mail, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"accepted" | "rejected" | null>(null);
  const [applicant, setApplicant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadApplicant = async () => {
      try {
        setLoading(true);
        const res = await graphqlRequest<any>(GET_APPLICATION_DETAIL, { applicationId: parseInt(id) });
        setApplicant(res.applicationDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data pelamar");
      } finally {
        setLoading(false);
      }
    };

    loadApplicant();
  }, [id]);

  const backToCandidates = () => {
    if (applicant?.jobId) {
      navigate(`/perusahaan/lowongan/${applicant.jobId}/pelamar`);
    } else {
      navigate("/perusahaan/dashboard");
    }
  };

  const handleAction = (type: "accepted" | "rejected") => {
    setActionType(type);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!applicant || !actionType) return;

    try {
      await graphqlMutation<any>(UPDATE_APPLICATION_STATUS, { applicationId: applicant.id, status: actionType });
      setShowModal(false);
      backToCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-5xl mx-auto">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-5xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {error || "Data pelamar tidak ditemukan"}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={backToCandidates}
            className="text-[var(--coral)] hover:underline mb-4 inline-block"
          >
            ← Kembali ke Daftar Pelamar
          </button>

          <h1 className="text-4xl font-bold mb-2">Detail Pelamar</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Informasi kandidat.
          </p>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-border mb-6">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--coral)] to-[var(--peach)] flex items-center justify-center text-5xl flex-shrink-0">
                👨
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{applicant.applicantName}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[var(--coral)]" />
                    {applicant.applicantEmail}
                  </div>
                </div>
              </div>

              <span
                className={`px-4 py-2 rounded-2xl text-sm font-semibold ${applicant.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : applicant.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
              >
                {applicant.status === "pending"
                  ? "Pending"
                  : applicant.status === "accepted"
                    ? "Diterima"
                    : "Ditolak"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--coral)]" />
                  Skills
                </h3>

                <div className="flex flex-wrap gap-2">
                  {applicant.skills?.length > 0 ? (
                    applicant.skills.map((skill: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-[var(--yellow-light)] text-[var(--coral)] rounded-xl text-sm font-medium"
                      >
                        {skill.skillName} L{skill.level}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Tidak ada skill</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--coral)]" />
                  Project / Pengalaman
                </h3>

                <div className="space-y-3">
                  {applicant.projects?.length > 0 ? (
                    applicant.projects.map((exp: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-[var(--coral)] pl-4">
                        <h4 className="font-semibold">{exp.projectName}</h4>
                        <p className="text-sm text-muted-foreground">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">{exp.link || "N/A"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Tidak ada project</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--coral)]" />
                Sertifikat
              </h3>
              <div className="space-y-3">
                {applicant.certificates?.length > 0 ? (
                  applicant.certificates.map((cert: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-[var(--coral)] pl-4">
                      <h4 className="font-semibold">{cert.certificateName}</h4>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      <p className="text-xs text-muted-foreground">{cert.issueDate} {cert.skillName && `• ${cert.skillName}`}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Tidak ada sertifikat</p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--coral)]" />
                Curriculum Vitae (CV)
              </h3>
              <div className="bg-gray-50 p-4 rounded-2xl border border-border">
                {applicant.cvPath ? (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <FileText className="w-8 h-8 text-[var(--coral)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Dokumen CV Pelamar</p>
                      <a
                        href={`${import.meta.env.VITE_API_URL}${applicant.cvPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--coral)] text-sm hover:underline font-medium inline-block mt-1"
                      >
                        Lihat CV (Buka di tab baru)
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500 font-medium">{applicant.cvMessage || "Pelamar belum mengupload CV"}</p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-xl font-semibold mb-4">Matching Score</h3>
              <div className="text-2xl font-bold text-[var(--coral)]">
                {Math.round(applicant.matchingScore)}%
              </div>
            </div>
          </div>

          {applicant.status === "pending" && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
              <h3 className="text-2xl font-bold mb-6">Aksi Seleksi</h3>

              <div className="flex gap-4">
                <button
                  onClick={() => handleAction("accepted")}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Terima Pelamar
                </button>

                <button
                  onClick={() => handleAction("rejected")}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600"
                >
                  <XCircle className="w-5 h-5" />
                  Tolak Pelamar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {actionType === "accepted" ? "Terima Pelamar?" : "Tolak Pelamar?"}
            </h3>

            <p className="text-muted-foreground mb-6">
              {actionType === "accepted"
                ? "Anda yakin ingin menerima pelamar ini?"
                : "Anda yakin ingin menolak pelamar ini?"}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border-2 border-border rounded-2xl font-medium hover:border-[var(--coral)]"
              >
                Batal
              </button>

              <button
                onClick={confirmAction}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold text-white ${actionType === "accepted"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                  }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}