import { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import Footer from "../components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  GET_PENDING_COMPANIES,
  GET_PENDING_JOBS,
  GET_USERS,
  VALIDATE_COMPANY,
  REJECT_COMPANY,
  VALIDATE_JOB,
  REJECT_JOB,
  LOCK_USER,
  UNLOCK_USER,
  VERIFY_USER,
  graphqlRequest,
  graphqlMutation,
} from "../services/graphql";
import { toast } from "sonner";

export default function AdminPage() {
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
    fetchJobs();
    fetchUsers();
  }, []);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await graphqlRequest<any>(GET_PENDING_COMPANIES);
      setPendingCompanies(res.pendingCompanies || []);
    } catch (error) {
      toast.error("Gagal memuat daftar perusahaan");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await graphqlRequest<any>(GET_PENDING_JOBS);
      setPendingJobs(res.pendingJobs || []);
    } catch (error) {
      toast.error("Gagal memuat daftar lowongan");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await graphqlRequest<any>(GET_USERS);
      setAllUsers(res.users || []);
    } catch (error) {
      toast.error("Gagal memuat daftar user");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleValidateCompany = async (companyId: number, companyName: string) => {
    setActionLoading(`validate-company-${companyId}`);
    try {
      await graphqlMutation<any>(VALIDATE_COMPANY, { companyId });
      setPendingCompanies(pendingCompanies.filter((c) => c.id !== companyId));
      toast.success(`Perusahaan "${companyName}" berhasil divalidasi`);
    } catch (error: any) {
      toast.error(error.message || "Gagal memvalidasi perusahaan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCompany = async (companyId: number, companyName: string) => {
    setActionLoading(`reject-company-${companyId}`);
    try {
      await graphqlMutation<any>(REJECT_COMPANY, { companyId });
      setPendingCompanies(pendingCompanies.filter((c) => c.id !== companyId));
      toast.success(`Perusahaan "${companyName}" berhasil ditolak`);
    } catch (error: any) {
      toast.error(error.message || "Gagal menolak perusahaan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateJob = async (jobId: number, jobTitle: string) => {
    setActionLoading(`validate-job-${jobId}`);
    try {
      await graphqlMutation<any>(VALIDATE_JOB, { jobId });
      setPendingJobs(pendingJobs.filter((j) => j.id !== jobId));
      toast.success(`Lowongan "${jobTitle}" berhasil divalidasi`);
    } catch (error: any) {
      toast.error(error.message || "Gagal memvalidasi lowongan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectJob = async (jobId: number, jobTitle: string) => {
    setActionLoading(`reject-job-${jobId}`);
    try {
      await graphqlMutation<any>(REJECT_JOB, { jobId });
      setPendingJobs(pendingJobs.filter((j) => j.id !== jobId));
      toast.success(`Lowongan "${jobTitle}" berhasil ditolak`);
    } catch (error: any) {
      toast.error(error.message || "Gagal menolak lowongan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLockUser = async (userId: number, userName: string) => {
    setActionLoading(`lock-user-${userId}`);
    try {
      await graphqlMutation<any>(LOCK_USER, { userId });
      setAllUsers(allUsers.map((u) => (u.id === userId ? { ...u, isLocked: true } : u)));
      toast.success(`Akun "${userName}" berhasil dikunci`);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunci akun");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlockUser = async (userId: number, userName: string) => {
    setActionLoading(`unlock-user-${userId}`);
    try {
      await graphqlMutation<any>(UNLOCK_USER, { userId });
      setAllUsers(allUsers.map((u) => (u.id === userId ? { ...u, isLocked: false } : u)));
      toast.success(`Akun "${userName}" berhasil dibuka`);
    } catch (error: any) {
      toast.error(error.message || "Gagal membuka akun");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyUser = async (userId: number, userName: string) => {
    setActionLoading(`verify-user-${userId}`);
    try {
      await graphqlMutation<any>(VERIFY_USER, { userId });
      setAllUsers(allUsers.map((u) => (u.id === userId ? { ...u, isVerified: true } : u)));
      toast.success(`Akun "${userName}" berhasil diverifikasi`);
    } catch (error: any) {
      toast.error(error.message || "Gagal memverifikasi akun");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Kelola validasi perusahaan, lowongan, dan akun pengguna</p>
          </div>

          <Tabs defaultValue="companies" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-gray-100">
              <TabsTrigger value="companies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--coral)] data-[state=active]:to-[var(--peach)] data-[state=active]:text-white">
                Perusahaan ({pendingCompanies.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--coral)] data-[state=active]:to-[var(--peach)] data-[state=active]:text-white">Lowongan ({pendingJobs.length})</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--coral)] data-[state=active]:to-[var(--peach)] data-[state=active]:text-white">User ({allUsers.length})</TabsTrigger>
            </TabsList>

            {/* Companies Tab */}
            <TabsContent value="companies" className="space-y-4">
              {loadingCompanies ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Loading perusahaan...
                  </CardContent>
                </Card>
              ) : pendingCompanies.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Tidak ada perusahaan yang menunggu validasi
                  </CardContent>
                </Card>
              ) : (
                pendingCompanies.map((company) => (
                  <Card key={company.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{company.companyName}</CardTitle>
                          <CardDescription className="mt-1">
                            <div className="text-sm">
                              <p>
                                <strong>Pemilik:</strong> {company.ownerName} ({company.ownerEmail})
                              </p>
                              <p>
                                <strong>Alamat:</strong> {company.address}
                              </p>
                              <p className="mt-2">
                                <strong>Deskripsi:</strong> {company.description}
                              </p>
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant={company.isValidated ? "default" : "secondary"}>
                          {company.isValidated ? "Tervalidasi" : "Menunggu"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-3 justify-end pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleValidateCompany(company.id, company.companyName)}
                        disabled={actionLoading === `validate-company-${company.id}`}
                      >
                        {actionLoading === `validate-company-${company.id}` ? "Loading..." : "Terima"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectCompany(company.id, company.companyName)}
                        disabled={actionLoading === `reject-company-${company.id}`}
                      >
                        {actionLoading === `reject-company-${company.id}` ? "Loading..." : "Tolak"}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-4">
              {loadingJobs ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Loading lowongan...
                  </CardContent>
                </Card>
              ) : pendingJobs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Tidak ada lowongan yang menunggu validasi
                  </CardContent>
                </Card>
              ) : (
                pendingJobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{job.jobTitle}</CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            <p>
                              <strong>Perusahaan:</strong> {job.companyName}
                            </p>
                            <p>
                              <strong>Lokasi:</strong> {job.location}
                            </p>
                            <p>
                              <strong>Tipe:</strong> {job.jobType}
                            </p>
                            <p className="mt-2 line-clamp-2">
                              <strong>Deskripsi:</strong> {job.jobDescription}
                            </p>
                          </CardDescription>
                        </div>
                        <div className="ml-4">
                          <Badge variant={job.isValidated ? "default" : "secondary"}>
                            {job.isValidated ? "Tervalidasi" : "Menunggu"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-3 justify-end pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleValidateJob(job.id, job.jobTitle)}
                        disabled={actionLoading === `validate-job-${job.id}`}
                      >
                        {actionLoading === `validate-job-${job.id}` ? "Loading..." : "Terima"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectJob(job.id, job.jobTitle)}
                        disabled={actionLoading === `reject-job-${job.id}`}
                      >
                        {actionLoading === `reject-job-${job.id}` ? "Loading..." : "Tolak"}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {loadingUsers ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Loading user...
                  </CardContent>
                </Card>
              ) : allUsers.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Tidak ada user
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <Card key={user.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{user.fullName}</CardTitle>
                            <CardDescription className="mt-1 text-sm">
                              <p>
                                <strong>Email:</strong> {user.email}
                              </p>
                              <p>
                                <strong>Role:</strong> {user.role}
                              </p>
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={user.isVerified ? "default" : "secondary"}>
                              {user.isVerified ? "Diverifikasi" : "Belum Verifikasi"}
                            </Badge>
                            <Badge variant={user.isLocked ? "destructive" : "outline"}>
                              {user.isLocked ? "Dikunci" : "Aktif"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex gap-3 justify-end pt-2">
                        {user.role !== "admin" && (
                          <>
                            {!user.isVerified && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleVerifyUser(user.id, user.fullName)}
                                disabled={actionLoading === `verify-user-${user.id}`}
                              >
                                {actionLoading === `verify-user-${user.id}` ? "Loading..." : "Verifikasi"}
                              </Button>
                            )}
                            {user.isLocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnlockUser(user.id, user.fullName)}
                                disabled={actionLoading === `unlock-user-${user.id}`}
                              >
                                {actionLoading === `unlock-user-${user.id}` ? "Loading..." : "Buka Kunci"}
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleLockUser(user.id, user.fullName)}
                                disabled={actionLoading === `lock-user-${user.id}`}
                              >
                                {actionLoading === `lock-user-${user.id}` ? "Loading..." : "Kunci Akun"}
                              </Button>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
