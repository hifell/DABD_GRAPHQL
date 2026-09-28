import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import {
  GET_PROFILE_OVERVIEW,
  GET_SKILLS,
  GET_RECOMMENDED_JOBS,
  ADD_SKILL,
  DELETE_SKILL,
  ADD_PROJECT,
  DELETE_PROJECT,
  ADD_CERTIFICATE,
  DELETE_CERTIFICATE,
  GET_MY_APPLICATIONS,
  graphqlRequest,
  graphqlMutation,
} from "../services/graphql";
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Plus,
  Trash2,
  Award,
  Code,
  Calendar,
  Building,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router";


interface Application {
  id: number;
  job_title: string;
  company_name: string;
  applied_at: string;
  status: string;
}

interface Skill {
  id: number;
  skill_name: string;
  level: number;
}

interface Project {
  id: number;
  project_name: string;
  description: string;
  link: string;
  skills?: string[];
}

interface Certificate {
  id: number;
  certificate_name: string;
  issuer: string;
  issue_date: string;
}

export default function ApplicantDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [applications, setApplications] = useState<Application[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [masterSkills, setMasterSkills] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);

  const [newSkill, setNewSkill] = useState({ nama: "", level: 3 });
  const [skillError, setSkillError] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const [newProject, setNewProject] = useState({
    nama: "",
    deskripsi: "",
    link: "",
  });
  const [projectError, setProjectError] = useState("");
  const [selectedProjectSkillIds, setSelectedProjectSkillIds] = useState<number[]>([]);
  const [projectSkillSearch, setProjectSkillSearch] = useState("");
  const [showProjectSkillDropdown, setShowProjectSkillDropdown] = useState(false);

  const [newCertificate, setNewCertificate] = useState({
    nama: "",
    penerbit: "",
    tanggalTerbit: "",
  });
  const [certificateError, setCertificateError] = useState("");

  const [cvData, setCvData] = useState<{file_path: string, uploaded_at: string} | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [cvSuccess, setCvSuccess] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileRes, skillRes, recommendedRes] = await Promise.all([
        graphqlRequest<any>(GET_PROFILE_OVERVIEW),
        graphqlRequest<any>(GET_SKILLS),
        graphqlRequest<any>(GET_RECOMMENDED_JOBS, { limit: 6 }),
      ]);

      const profile = profileRes.profileOverview;
      const skillMaster = skillRes.skills || [];
      const recommended = recommendedRes.recommendedJobs || [];

      setMasterSkills(skillMaster);
      setRecommendedJobs(recommended);

      setApplications(profile.applications || []);

      setSkills(
        (profile.skills || []).map((s: any) => ({
          id: s.id,
          skill_name: s.skillName,
          level: s.level,
        }))
      );

      setProjects(
        (profile.projects || []).map((p: any, idx: number) => ({
          id: idx + 1,
          project_name: p.projectName,
          description: p.description,
          link: p.link || "",
          skills: [],
        }))
      );

      setCertificates(
        (profile.certificates || []).map((c: any, idx: number) => ({
          id: idx + 1,
          certificate_name: c.certificateName,
          issuer: c.issuer,
          issue_date: c.issueDate,
        }))
      );

      setCvData(profile.cv ? { file_path: profile.cv.filePath, uploaded_at: profile.cv.uploadedAt } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const getStatusColor = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "bg-yellow-100 text-yellow-700";
    if (s === "accepted") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "Diproses";
    if (s === "accepted") return "Diterima";
    if (s === "rejected") return "Ditolak";
    return status;
  };

  const getStatusIcon = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return <Clock className="w-4 h-4" />;
    if (s === "accepted") return <CheckCircle2 className="w-4 h-4" />;
    if (s === "rejected") return <XCircle className="w-4 h-4" />;
    return null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const getLevelLabel = (level: number) => {
    const labels = ["Pemula", "Dasar", "Menengah", "Mahir", "Ahli"];
    return labels[level - 1] || "Pemula";
  };

  const handleAddSkill = async () => {
    setSkillError("");

    if (!newSkill.nama.trim()) {
      setSkillError("Nama skill wajib diisi");
      return;
    }

    if (skills.length >= 10) {
      setSkillError("Maksimal 10 skill dapat ditambahkan");
      return;
    }

    const selectedSkill = masterSkills.find(
      (skill) => skill.skillName.toLowerCase() === newSkill.nama.toLowerCase()
    );

    if (!selectedSkill) {
      setSkillError("Skill harus dipilih dari Skill Master");
      return;
    }

    try {
      const result = await graphqlMutation<any>(ADD_SKILL, {
        input: { skillId: selectedSkill.id, level: newSkill.level }
      });

      setSkills([
        ...skills,
        {
          id: result.addSkill.skill.id,
          skill_name: result.addSkill.skill.skillName,
          level: result.addSkill.skill.level,
        },
      ]);

      setNewSkill({ nama: "", level: 3 });
      setSkillSearch("");
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : "Gagal menambah skill");
    }
  };

  const handleRemoveSkill = async (id: number) => {
    try {
      await graphqlMutation<any>(DELETE_SKILL, { userSkillId: id });
      setSkills(skills.filter((s) => s.id !== id));
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : "Gagal menghapus skill");
    }
  };

  const handleAddProject = async () => {
    setProjectError("");

    if (!newProject.nama.trim()) {
      setProjectError("Nama project wajib diisi");
      return;
    }

    if (newProject.nama.length > 100) {
      setProjectError("Nama project maksimal 100 karakter");
      return;
    }

    if (!newProject.deskripsi.trim()) {
      setProjectError("Deskripsi project wajib diisi");
      return;
    }

    if (selectedProjectSkillIds.length < 1) {
      setProjectError("Project wajib memiliki minimal 1 hard skill terkait");
      return;
    }

    try {
      const result = await graphqlMutation<any>(ADD_PROJECT, {
        input: {
          projectName: newProject.nama,
          description: newProject.deskripsi,
          link: newProject.link || null,
          skillIds: selectedProjectSkillIds,
        }
      });

      setProjects([
        ...projects,
        {
          id: Date.now(),
          project_name: newProject.nama,
          description: newProject.deskripsi,
          link: newProject.link,
          skills: [],
        },
      ]);

      setNewProject({ nama: "", deskripsi: "", link: "" });
      setSelectedProjectSkillIds([]);
      setProjectSkillSearch("");
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : "Gagal menambah project");
    }
  };

  const handleRemoveProject = async (id: number) => {
    try {
      await graphqlMutation<any>(DELETE_PROJECT, { projectId: id });
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : "Gagal menghapus project");
    }
  };

  const handleAddCertificate = async () => {
    setCertificateError("");

    if (!newCertificate.nama.trim()) {
      setCertificateError("Nama sertifikat wajib diisi");
      return;
    }

    if (!newCertificate.penerbit.trim()) {
      setCertificateError("Penerbit wajib diisi");
      return;
    }

    if (!newCertificate.tanggalTerbit) {
      setCertificateError("Tanggal terbit wajib diisi");
      return;
    }

    try {
      const result = await graphqlMutation<any>(ADD_CERTIFICATE, {
        input: {
          certificateName: newCertificate.nama,
          issuer: newCertificate.penerbit,
          issueDate: newCertificate.tanggalTerbit,
          skillId: null,
        }
      });

      setCertificates([
        ...certificates,
        {
          id: Date.now(),
          certificate_name: newCertificate.nama,
          issuer: newCertificate.penerbit,
          issue_date: newCertificate.tanggalTerbit,
        },
      ]);

      setNewCertificate({ nama: "", penerbit: "", tanggalTerbit: "" });
    } catch (err) {
      setCertificateError(err instanceof Error ? err.message : "Gagal menambah sertifikat");
    }
  };

  const handleRemoveCertificate = async (id: number) => {
    try {
      await graphqlMutation<any>(DELETE_CERTIFICATE, { certificateId: id });
      setCertificates(certificates.filter((c) => c.id !== id));
    } catch (err) {
      setCertificateError(err instanceof Error ? err.message : "Gagal menghapus sertifikat");
    }
  };

  const handleUploadCv = async () => {
    setCvError("");
    setCvSuccess("");

    if (!cvFile) {
      setCvError("Pilih file PDF terlebih dahulu");
      return;
    }

    if (cvFile.type !== "application/pdf") {
      setCvError("File harus berupa PDF");
      return;
    }

    if (cvFile.size > 5 * 1024 * 1024) {
      setCvError("Ukuran file maksimal 5MB");
      return;
    }

    try {
      setUploadingCv(true);
      // Note: CV upload via GraphQL multipart not implemented yet
      // Using REST endpoint directly for file uploads
      const formData = new FormData();
      formData.append("file", cvFile);
      const token = sessionStorage.getItem("kerjole_token");
      const API_URL = import.meta.env.VITE_API_URL || "https://kerjo-le-platform-kmtdzqcpl-evanhauzal-6126s-projects.vercel.app";
      const res = await fetch(`${API_URL}/profile/cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setCvData({
        file_path: result.file_path,
        uploaded_at: new Date().toISOString()
      });
      setCvSuccess("CV berhasil diupload");
      setCvFile(null);
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Gagal mengupload CV");
    } finally {
      setUploadingCv(false);
    }
  };

  const totalApplications = applications.length;
  const acceptedCount = applications.filter((a) => String(a.status).toLowerCase() === "accepted").length;
  const pendingCount = applications.filter((a) => String(a.status).toLowerCase() === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && <p className="mb-8 text-muted-foreground">Loading dashboard...</p>}

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard Pelamar</h1>
            <p className="text-muted-foreground text-lg">
              Selamat datang kembali!
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-8 bg-transparent border-b border-border rounded-none p-0 h-auto w-full flex gap-0 justify-start">
              <TabsTrigger value="overview" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF6B6B] data-[state=active]:text-[#FF6B6B] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent shadow-none px-4 py-3 text-sm font-medium text-muted-foreground hover:text-[#FF6B6B] transition-colors">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Overview Lamaran</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF6B6B] data-[state=active]:text-[#FF6B6B] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent shadow-none px-4 py-3 text-sm font-medium text-muted-foreground hover:text-[#FF6B6B] transition-colors">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Kelola Hard Skill</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF6B6B] data-[state=active]:text-[#FF6B6B] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent shadow-none px-4 py-3 text-sm font-medium text-muted-foreground hover:text-[#FF6B6B] transition-colors">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Kelola Project</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF6B6B] data-[state=active]:text-[#FF6B6B] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent shadow-none px-4 py-3 text-sm font-medium text-muted-foreground hover:text-[#FF6B6B] transition-colors">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Kelola Sertifikat</span>
              </TabsTrigger>
              <TabsTrigger value="cv" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF6B6B] data-[state=active]:text-[#FF6B6B] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent shadow-none px-4 py-3 text-sm font-medium text-muted-foreground hover:text-[#FF6B6B] transition-colors">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Kelola CV</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Lamaran</p>
                      <p className="text-3xl font-bold text-[#FF6B6B]">{totalApplications}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Lamaran Diterima</p>
                      <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Lamaran Diproses</p>
                      <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
                <h2 className="text-2xl font-bold mb-6">Status Lamaran Terbaru</h2>

                <div className="space-y-3">
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <div key={app.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-[#FF6B6B]">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{app.jobTitle}</h3>
                          <p className="text-sm text-muted-foreground truncate">{app.companyName}</p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {getStatusLabel(app.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{formatDate(app.appliedAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">Belum ada lamaran</p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Rekomendasi Untuk Anda</h2>

                  <Link
                    to="/lowongan"
                    className="text-sm font-semibold text-[#FF6B6B] hover:underline"
                  >
                    Cari lowongan lain
                  </Link>
                </div>

                {recommendedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedJobs.slice(0, 4).map((job) => (
                      <Link
                        key={job.id}
                        to={`/lowongan/${job.id}`}
                        className="p-5 border border-border rounded-2xl hover:border-[#FF6B6B] hover:bg-red-50/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-base">{job.jobTitle}</h3>
                            <p className="text-sm text-muted-foreground">{job.companyName}</p>
                            <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
                          </div>

                          <span className="px-3 py-1 bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-full text-xs font-semibold">
                            {job.jobType}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {job.requiredSkills?.slice(0, 3).map((skill: any) => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 rounded-full bg-gray-100 text-xs"
                            >
                              {skill.skillName}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Belum ada rekomendasi lowongan. Tambahkan hard skill agar rekomendasi lebih sesuai.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
                <h2 className="text-2xl font-bold mb-1">Kelola Hard Skill</h2>
                <p className="text-muted-foreground text-sm mb-6">Maksimal 10 skill dapat ditambahkan (BR-06)</p>

                <div className="mb-6">
                  <p className="font-semibold text-sm mb-3">Skills Anda ({skills.length}/10)</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill.id} className="inline-flex items-center gap-1.5 bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20 rounded-full px-3 py-1.5 text-sm font-medium">
                        {skill.skill_name}
                        <span className="text-xs text-[#FF6B6B]/60 ml-0.5">{getLevelLabel(skill.level)}</span>
                        <button onClick={() => handleRemoveSkill(skill.id)} className="ml-1 hover:bg-[#FF6B6B]/20 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {skillError && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{skillError}</p>}

                <div className="space-y-5 border-t pt-6">
                  <h3 className="font-semibold text-base">Tambah Skill Baru</h3>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1.5">Nama Skill <span className="text-[#FF6B6B]">*</span></label>
                    <div className="relative">
                      <Input
                        placeholder="Cth: React, TypeScript, UI Design"
                        value={skillSearch}
                        onChange={(e) => {
                          setSkillSearch(e.target.value);
                          setShowSkillDropdown(true);
                        }}
                        onFocus={() => setShowSkillDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                        className="h-11 pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {newSkill.nama && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20 rounded-full px-3 py-1 text-sm font-medium">
                        {newSkill.nama}
                        <button
                          type="button"
                          onClick={() => setNewSkill({ ...newSkill, nama: "" })}
                          className="ml-1 hover:bg-[#FF6B6B]/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {showSkillDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {masterSkills
                          .filter(
                            (ms: any) =>
                              ms.skillName.toLowerCase().includes(skillSearch.toLowerCase()) &&
                              !skills.some((s) => s.skillName.toLowerCase() === ms.skillName.toLowerCase())
                          )
                          .map((ms: any) => (
                            <button
                              key={ms.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewSkill({ ...newSkill, nama: ms.skillName });
                                setSkillSearch("");
                                setShowSkillDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FF6B6B]/5 transition-colors"
                            >
                              {ms.skillName}
                            </button>
                          ))}
                        {masterSkills.filter(
                          (ms: any) =>
                            ms.skillName.toLowerCase().includes(skillSearch.toLowerCase()) &&
                            !skills.some((s) => s.skillName.toLowerCase() === ms.skillName.toLowerCase())
                        ).length === 0 && (
                            <p className="px-4 py-3 text-sm text-muted-foreground text-center">Tidak ada skill ditemukan</p>
                          )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Level Keahlian <span className="text-[#FF6B6B]">*</span></label>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[newSkill.level]}
                      onValueChange={(value) => setNewSkill({ ...newSkill, level: value[0] })}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">1 - Pemula</span>
                      <span className="text-xs font-semibold text-[#FF6B6B]">{getLevelLabel(newSkill.level)}</span>
                      <span className="text-xs text-muted-foreground">5 - Ahli</span>
                    </div>
                  </div>

                  <Button onClick={handleAddSkill} className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white rounded-full h-11">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Skill
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
                <h2 className="text-2xl font-bold mb-1">Kelola Project</h2>
                <p className="text-muted-foreground text-sm mb-6">Tampilkan karya terbaik Anda kepada perekrut</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {projects.map((project) => (
                    <div key={project.id} className="p-6 border border-border rounded-2xl hover:border-[#FF6B6B]">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="font-semibold">{project.projectName}</h4>
                        <button onClick={() => handleRemoveProject(project.id)} className="p-2 hover:bg-red-100 rounded-lg text-[#FF6B6B]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF6B6B] hover:underline break-all">
                          {project.link}
                        </a>
                      )}

                      {project.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {project.skills.map((skill) => (
                            <Badge key={skill} className="bg-[#FF6B6B]/10 text-[#FF6B6B]">
                              <Code className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {projectError && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{projectError}</p>}

                <div className="space-y-5 border-t pt-6">
                  <h3 className="font-semibold text-base">Tambah Project Baru</h3>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Project <span className="text-[#FF6B6B]">*</span></label>
                    <Input
                      placeholder="Cth: E-Commerce App, Portfolio Website"
                      value={newProject.nama}
                      maxLength={100}
                      onChange={(e) => setNewProject({ ...newProject, nama: e.target.value.slice(0, 100) })}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Deskripsi <span className="text-[#FF6B6B]">*</span></label>
                    <textarea
                      placeholder="Jelaskan project Anda secara singkat"
                      value={newProject.deskripsi}
                      onChange={(e) => setNewProject({ ...newProject, deskripsi: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg resize-none bg-input-background text-base md:text-sm focus:border-ring focus:ring-ring/50 focus:ring-[3px] outline-none transition-[color,box-shadow]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Link Project</label>
                    <Input
                      placeholder="https://github.com/..."
                      value={newProject.link}
                      onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      placeholder="Cari hard skill terkait..."
                      value={projectSkillSearch}
                      onChange={(e) => {
                        setProjectSkillSearch(e.target.value);
                        setShowProjectSkillDropdown(true);
                      }}
                      onFocus={() => setShowProjectSkillDropdown(true)}
                      className="pr-10 h-11"
                    />

                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                    {showProjectSkillDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                        {masterSkills
                          .filter(
                            (skill: any) =>
                              skill.skillName.toLowerCase().includes(projectSkillSearch.toLowerCase()) &&
                              !selectedProjectSkillIds.includes(skill.id)
                          )
                          .map((skill: any) => (
                            <button
                              key={skill.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();

                                setSelectedProjectSkillIds((prev) => {
                                  if (prev.includes(skill.id)) return prev;
                                  return [...prev, skill.id];
                                });

                                setProjectSkillSearch("");
                                setShowProjectSkillDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-[#FF6B6B]/5"
                            >
                              {skill.skillName}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedProjectSkillIds.map((skillId) => {
                      const skill = masterSkills.find((item: any) => item.id === skillId);
                      if (!skill) return null;

                      return (
                        <Badge key={skill.id} className="bg-[#FF6B6B]/10 text-[#FF6B6B]">
                          {skill.skillName}
                          <button
                            type="button"
                            onClick={() => setSelectedProjectSkillIds(selectedProjectSkillIds.filter((id) => id !== skill.id))}
                            className="ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>

                  <Button onClick={handleAddProject} className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white rounded-full h-11">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Project
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
                <h2 className="text-2xl font-bold mb-1">Kelola Sertifikat</h2>
                <p className="text-muted-foreground text-sm mb-6">Tampilkan kredensial dan penghargaan Anda</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-6 border border-border rounded-2xl hover:border-[#FF6B6B]">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <Award className="w-5 h-5 text-[#FF6B6B]" />
                        <button onClick={() => handleRemoveCertificate(cert.id)} className="p-2 hover:bg-red-100 rounded-lg text-[#FF6B6B]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="font-semibold mb-2">{cert.certificateName}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {cert.issuer}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cert.issueDate)}
                      </p>
                    </div>
                  ))}
                </div>

                {certificateError && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{certificateError}</p>}

                <div className="space-y-5 border-t pt-6">
                  <h3 className="font-semibold text-base">Tambah Sertifikat Baru</h3>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Sertifikat <span className="text-[#FF6B6B]">*</span></label>
                    <Input
                      placeholder="Cth: AWS Certified, Google Analytics"
                      value={newCertificate.nama}
                      onChange={(e) => setNewCertificate({ ...newCertificate, nama: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Penerbit <span className="text-[#FF6B6B]">*</span></label>
                    <Input
                      placeholder="Cth: Amazon, Google, Microsoft"
                      value={newCertificate.penerbit}
                      onChange={(e) => setNewCertificate({ ...newCertificate, penerbit: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tanggal Terbit <span className="text-[#FF6B6B]">*</span></label>
                    <Input
                      type="date"
                      value={newCertificate.tanggalTerbit}
                      onChange={(e) => setNewCertificate({ ...newCertificate, tanggalTerbit: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <Button onClick={handleAddCertificate} className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white rounded-full h-11">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Sertifikat
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cv" className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
                <h2 className="text-2xl font-bold mb-1">Kelola Curriculum Vitae (CV)</h2>
                <p className="text-muted-foreground text-sm mb-6">Unggah dokumen CV Anda dalam format PDF</p>

                {cvData ? (
                  <div className="mb-8 p-6 border border-border rounded-2xl bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white rounded-2xl shadow-sm">
                        <FileText className="w-8 h-8 text-[var(--coral)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">CV Anda Telah Terunggah</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Terakhir diunggah: {formatDate(cvData.uploaded_at)}
                        </p>
                        <a
                          href={`${import.meta.env.VITE_API_URL}${cvData.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--coral)] text-sm font-semibold hover:underline inline-block mt-2"
                        >
                          Lihat Dokumen CV
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-2xl text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Anda belum mengupload CV</p>
                  </div>
                )}

                {cvError && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{cvError}</p>}
                {cvSuccess && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{cvSuccess}</p>}

                <div className="space-y-5 border-t pt-6">
                  <h3 className="font-semibold text-base">{cvData ? "Perbarui CV" : "Upload CV"}</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">File PDF (Maks 5MB) <span className="text-[#FF6B6B]">*</span></label>
                    <Input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        setCvError("");
                        setCvSuccess("");
                        if (e.target.files && e.target.files[0]) {
                          setCvFile(e.target.files[0]);
                        }
                      }}
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF6B6B]/10 file:text-[#FF6B6B] hover:file:bg-[#FF6B6B]/20"
                    />
                  </div>

                  <Button onClick={handleUploadCv} disabled={uploadingCv || !cvFile} className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white rounded-full h-11 disabled:opacity-50">
                    <Plus className="w-4 h-4 mr-2" />
                    {uploadingCv ? "Mengupload..." : (cvData ? "Update CV" : "Upload CV")}
                  </Button>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}