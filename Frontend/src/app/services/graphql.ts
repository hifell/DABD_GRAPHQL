import { Client, cacheExchange, fetchExchange, gql } from '@urql/core';

export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || import.meta.env.VITE_API_URL + '/graphql' || "https://kerjo-le-platform-kmtdzqcpl-evanhauzal-6126s-projects.vercel.app/graphql";

export const client = new Client({
  url: GRAPHQL_URL,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = sessionStorage.getItem("kerjole_token");
    return {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  },
});

// Types
export type Role = "USER" | "COMPANY" | "ADMIN";

export type LoginResponse = {
  login: {
    accessToken: string;
    tokenType: string;
    role: Role;
  };
};

export type RegisterUserResponse = {
  registerUser: {
    message: string;
    userId: number;
  };
};

export type RegisterCompanyResponse = {
  registerCompany: {
    message: string;
    companyId: number;
  };
};

export type UserType = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  isVerified: boolean;
  isLocked: boolean;
  company?: {
    id: number;
    companyName: string;
    address: string;
    description: string;
    isValidated: boolean;
  };
};

export type MeResponse = {
  me: UserType;
};

export type SkillType = {
  id: number;
  skillName: string;
  isActive: boolean;
};

export type JobType = {
  id: number;
  companyId: number;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  jobQualification: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  status: string;
  expiredDate?: string;
  isValidated: boolean;
  createdAt?: string;
  requiredSkills: Array<{ id: number; skillId: number; skillName: string; minimumLevel: number }>;
  totalApplicants: number;
};

export type ApplicationType = {
  id: number;
  userId: number;
  jobId: number;
  status: string;
  matchingScore: number;
  appliedAt?: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  companyName: string;
  skills: Array<{ skillName: string; level: number }>;
};

export type ProfileOverviewType = {
  profileOverview: {
    user: { id: number; fullName: string; email: string; role: Role };
    skills: Array<{ id: number; skillId: number; skillName: string; level: number }>;
    projects: Array<{ projectName: string; description: string; link?: string }>;
    certificates: Array<{ certificateName: string; issuer: string; issueDate: string; skillName?: string }>;
    softSkills: Array<{ id: number; softSkillName: string; rating: number }>;
    cv?: { filePath: string; uploadedAt: string };
    applications: Array<{
      id: number;
      jobId: number;
      jobTitle: string;
      companyName: string;
      status: string;
      matchingScore: number;
      appliedAt?: string;
    }>;
  };
};

// Auth operations
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      tokenType
      role
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      message
      userId
    }
  }
`;

export const REGISTER_COMPANY = gql`
  mutation RegisterCompany($input: RegisterCompanyInput!) {
    registerCompany(input: $input) {
      message
      companyId
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      fullName
      email
      role
      isVerified
      isLocked
      company {
        id
        companyName
        address
        description
        isValidated
      }
    }
  }
`;

// Skills operations
export const GET_SKILLS = gql`
  query GetSkills {
    skills {
      id
      skillName
      isActive
    }
  }
`;

// Jobs operations
export const GET_JOBS = gql`
  query GetJobs($keyword: String, $location: String, $jobType: String, $limit: Int) {
    jobs(keyword: $keyword, location: $location, jobType: $jobType, limit: $limit) {
      id
      companyId
      companyName
      jobTitle
      jobDescription
      jobQualification
      location
      salaryMin
      salaryMax
      jobType
      status
      expiredDate
      isValidated
      createdAt
      requiredSkills {
        id
        skillId
        skillName
        minimumLevel
      }
      totalApplicants
    }
  }
`;

export const GET_JOB = gql`
  query GetJob($id: Int!) {
    job(id: $id) {
      id
      companyId
      companyName
      jobTitle
      jobDescription
      jobQualification
      location
      salaryMin
      salaryMax
      jobType
      status
      expiredDate
      isValidated
      createdAt
      requiredSkills {
        id
        skillId
        skillName
        minimumLevel
      }
      totalApplicants
    }
  }
`;

export const GET_RECOMMENDED_JOBS = gql`
  query GetRecommendedJobs($limit: Int) {
    recommendedJobs(limit: $limit) {
      id
      companyId
      companyName
      jobTitle
      jobDescription
      location
      jobType
      status
      requiredSkills {
        skillName
        minimumLevel
      }
      totalApplicants
    }
  }
`;

export const GET_MY_COMPANY_JOBS = gql`
  query GetMyCompanyJobs {
    myCompanyJobs {
      company {
        id
        companyName
        address
        description
        isValidated
      }
      jobs {
        id
        companyId
        companyName
        jobTitle
        jobDescription
        jobQualification
        location
        salaryMin
        salaryMax
        jobType
        status
        expiredDate
        isValidated
        createdAt
        requiredSkills {
          id
          skillId
          skillName
          minimumLevel
        }
        totalApplicants
      }
    }
  }
`;

export const CREATE_JOB = gql`
  mutation CreateJob($input: JobCreateInput!) {
    createJob(input: $input) {
      message
      jobId
      job {
        id
        jobTitle
        status
      }
    }
  }
`;

export const CLOSE_JOB = gql`
  mutation CloseJob($jobId: Int!) {
    closeJob(jobId: $jobId) {
      message
      jobId
    }
  }
`;

// Profile operations
export const GET_PROFILE_OVERVIEW = gql`
  query GetProfileOverview {
    profileOverview {
      user {
        id
        fullName
        email
        role
      }
      skills {
        id
        skillId
        skillName
        level
      }
      projects {
        projectName
        description
        link
      }
      certificates {
        certificateName
        issuer
        issueDate
        skillName
      }
      softSkills {
        id
        softSkillName
        rating
      }
      cv {
        filePath
        uploadedAt
      }
      applications {
        id
        jobId
        jobTitle
        companyName
        status
        matchingScore
        appliedAt
      }
    }
  }
`;

export const GET_MY_SKILLS = gql`
  query GetMySkills {
    mySkills {
      id
      skillId
      skillName
      level
    }
  }
`;

export const ADD_SKILL = gql`
  mutation AddSkill($input: UserSkillInput!) {
    addSkill(input: $input) {
      message
      skill {
        id
        skillId
        skillName
        level
      }
    }
  }
`;

export const DELETE_SKILL = gql`
  mutation DeleteSkill($userSkillId: Int!) {
    deleteSkill(userSkillId: $userSkillId) {
      message
      success
    }
  }
`;

export const ADD_PROJECT = gql`
  mutation AddProject($input: ProjectInput!) {
    addProject(input: $input) {
      message
      project {
        projectName
        description
        link
      }
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($projectId: Int!) {
    deleteProject(projectId: $projectId) {
      message
      success
    }
  }
`;

export const ADD_CERTIFICATE = gql`
  mutation AddCertificate($input: CertificateInput!) {
    addCertificate(input: $input) {
      message
      certificate {
        certificateName
        issuer
        issueDate
        skillName
      }
    }
  }
`;

export const DELETE_CERTIFICATE = gql`
  mutation DeleteCertificate($certificateId: Int!) {
    deleteCertificate(certificateId: $certificateId) {
      message
      success
    }
  }
`;

export const ADD_SOFT_SKILL = gql`
  mutation AddSoftSkill($input: SoftSkillInput!) {
    addSoftSkill(input: $input) {
      message
      success
    }
  }
`;

// Applications operations
export const GET_MY_APPLICATIONS = gql`
  query GetMyApplications {
    myApplications {
      id
      userId
      jobId
      status
      matchingScore
      appliedAt
      applicantName
      applicantEmail
      jobTitle
      companyName
      skills {
        skillName
        level
      }
    }
  }
`;

export const APPLY_JOB = gql`
  mutation ApplyJob($jobId: Int!) {
    applyJob(jobId: $jobId) {
      message
      matchingScore
      application {
        id
        status
        matchingScore
      }
    }
  }
`;

export const GET_CANDIDATES = gql`
  query GetCandidates($jobId: Int!) {
    candidates(jobId: $jobId) {
      id
      userId
      jobId
      status
      matchingScore
      appliedAt
      applicantName
      applicantEmail
      jobTitle
      companyName
      skills {
        skillName
        level
      }
    }
  }
`;

export const GET_APPLICATION_DETAIL = gql`
  query GetApplicationDetail($applicationId: Int!) {
    applicationDetail(applicationId: $applicationId) {
      id
      userId
      jobId
      status
      matchingScore
      appliedAt
      applicantName
      applicantEmail
      cvPath
      cvMessage
      skills {
        skillName
        level
      }
      projects {
        projectName
        description
        link
      }
      certificates {
        certificateName
        issuer
        issueDate
        skillName
      }
    }
  }
`;

export const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus($applicationId: Int!, $status: String!) {
    updateApplicationStatus(applicationId: $applicationId, status: $status) {
      message
      application {
        id
        status
      }
    }
  }
`;

// Admin operations
export const GET_PENDING_COMPANIES = gql`
  query GetPendingCompanies {
    pendingCompanies {
      id
      companyName
      address
      description
      isValidated
      ownerName
      ownerEmail
      createdAt
    }
  }
`;

export const VALIDATE_COMPANY = gql`
  mutation ValidateCompany($companyId: Int!) {
    validateCompany(companyId: $companyId) {
      message
      company {
        id
        isValidated
      }
    }
  }
`;

export const REJECT_COMPANY = gql`
  mutation RejectCompany($companyId: Int!) {
    rejectCompany(companyId: $companyId) {
      message
      success
    }
  }
`;

export const GET_PENDING_JOBS = gql`
  query GetPendingJobs {
    pendingJobs {
      id
      jobTitle
      jobDescription
      companyName
      companyId
      location
      jobType
      status
      isValidated
      createdAt
    }
  }
`;

export const VALIDATE_JOB = gql`
  mutation ValidateJob($jobId: Int!) {
    validateJob(jobId: $jobId) {
      message
      job {
        id
        isValidated
        status
      }
    }
  }
`;

export const REJECT_JOB = gql`
  mutation RejectJob($jobId: Int!) {
    rejectJob(jobId: $jobId) {
      message
      success
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      fullName
      email
      role
      isVerified
      isLocked
      createdAt
    }
  }
`;

export const LOCK_USER = gql`
  mutation LockUser($userId: Int!) {
    lockUser(userId: $userId) {
      message
      user {
        id
        isLocked
      }
    }
  }
`;

export const UNLOCK_USER = gql`
  mutation UnlockUser($userId: Int!) {
    unlockUser(userId: $userId) {
      message
      user {
        id
        isLocked
      }
    }
  }
`;

export const VERIFY_USER = gql`
  mutation VerifyUser($userId: Int!) {
    verifyUser(userId: $userId) {
      message
      user {
        id
        isVerified
      }
    }
  }
`;

// Helper functions
export async function graphqlRequest<T>(query: any, variables?: any): Promise<T> {
  const result = await client.query(query, variables).toPromise();

  if (result.error) {
    const message = result.error.graphQLErrors[0]?.message || result.error.message;
    throw new Error(message);
  }

  return result.data as T;
}

export async function graphqlMutation<T>(mutation: any, variables?: any): Promise<T> {
  const result = await client.mutation(mutation, variables).toPromise();

  if (result.error) {
    const message = result.error.graphQLErrors[0]?.message || result.error.message;
    throw new Error(message);
  }

  if (result.data && result.data.errors) {
    throw new Error(result.data.errors[0].message);
  }

  return result.data as T;
}

// Auth helpers
export function getToken() {
  return sessionStorage.getItem("kerjole_token");
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function clearAuth() {
  sessionStorage.removeItem("kerjole_token");
  sessionStorage.removeItem("kerjole_role");
}

export function setAuth(token: string, role: string) {
  sessionStorage.setItem("kerjole_token", token);
  sessionStorage.setItem("kerjole_role", role);
}

export function getDashboardPath(role?: string) {
  const normalizedRole = String(
    role || sessionStorage.getItem("kerjole_role") || ""
  ).toUpperCase();
  if (normalizedRole === "COMPANY") return "/perusahaan/dashboard";
  if (normalizedRole === "ADMIN") return "/admin";
  return "/pelamar/dashboard";
}
