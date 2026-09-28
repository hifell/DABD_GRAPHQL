import strawberry
import enum
from typing import Optional, List
from datetime import datetime


class Role(enum.Enum):
    USER = "user"
    COMPANY = "company"
    ADMIN = "admin"


class JobStatusEnum(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class ApplicationStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


@strawberry.type
class CompanyType:
    id: int
    company_name: str
    address: str
    description: str
    is_validated: bool
    logo_path: Optional[str] = None


@strawberry.type
class UserType:
    id: int
    full_name: str
    email: str
    role: Role
    is_verified: bool
    is_locked: bool
    company: Optional[CompanyType] = None


@strawberry.type
class LoginResponse:
    access_token: str
    token_type: str
    role: Role


@strawberry.type
class SkillType:
    id: int
    skill_name: str
    is_active: bool


@strawberry.type
class UserSkillType:
    id: int
    skill_id: int
    skill_name: str
    level: int


@strawberry.type
class RequiredSkillType:
    id: int
    skill_id: int
    skill_name: str
    minimum_level: int


@strawberry.type
class JobType:
    id: int
    company_id: int
    company_name: str
    job_title: str
    job_description: str
    job_qualification: str
    location: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    job_type: str
    status: JobStatusEnum
    expired_date: Optional[str]
    is_validated: bool
    created_at: Optional[str]
    required_skills: List[RequiredSkillType]
    total_applicants: int


@strawberry.type
class CompanyJobsResponse:
    company: CompanyType
    jobs: List[JobType]


@strawberry.type
class ApplicationType:
    id: int
    user_id: int
    job_id: int
    status: str
    matching_score: int
    applied_at: Optional[str]
    applicant_name: str
    applicant_email: str
    job_title: str
    company_name: str
    skills: List["ApplicantSkillType"]


@strawberry.type
class ApplicantSkillType:
    skill_name: str
    level: int


@strawberry.type
class ApplicationDetailType:
    id: int
    user_id: int
    job_id: int
    status: str
    matching_score: int
    applied_at: Optional[str]
    applicant_name: str
    applicant_email: str
    cv_path: Optional[str]
    cv_message: Optional[str]
    skills: List[ApplicantSkillType]
    projects: List["ProjectType"]
    certificates: List["CertificateType"]


@strawberry.type
class ProjectType:
    project_name: str
    description: str
    link: Optional[str]


@strawberry.type
class CertificateType:
    certificate_name: str
    issuer: str
    issue_date: str
    skill_name: Optional[str]


@strawberry.type
class ProfileOverviewType:
    user: "UserBasicType"
    skills: List[UserSkillType]
    projects: List[ProjectType]
    certificates: List[CertificateType]
    soft_skills: List["SoftSkillType"]
    cv: Optional["CVType"]
    applications: List["ApplicationBasicType"]


@strawberry.type
class UserBasicType:
    id: int
    full_name: str
    email: str
    role: Role


@strawberry.type
class SoftSkillType:
    id: int
    soft_skill_name: str
    rating: int


@strawberry.type
class CVType:
    file_path: str
    uploaded_at: str


@strawberry.type
class ApplicationBasicType:
    id: int
    job_id: int
    job_title: str
    company_name: str
    status: str
    matching_score: int
    applied_at: Optional[str]


# Admin types
@strawberry.type
class AdminCompanyType:
    id: int
    company_name: str
    address: str
    description: str
    is_validated: bool
    owner_name: str
    owner_email: str
    created_at: Optional[str]


@strawberry.type
class AdminJobType:
    id: int
    job_title: str
    job_description: str
    company_name: str
    company_id: int
    location: str
    job_type: str
    status: str
    is_validated: bool
    created_at: Optional[str]


@strawberry.type
class AdminUserType:
    id: int
    full_name: str
    email: str
    role: str
    is_verified: bool
    is_locked: bool
    created_at: Optional[str]


# Input types
@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class RegisterUserInput:
    full_name: str
    email: str
    password: str


@strawberry.input
class RegisterCompanyInput:
    company_name: str
    email: str
    password: str
    address: str
    description: str


@strawberry.input
class RequiredSkillInput:
    skill_id: int
    minimum_level: int


@strawberry.input
class JobCreateInput:
    job_title: str
    job_description: str
    job_qualification: str
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: str
    status: str = "draft"
    expired_date: Optional[datetime] = None
    required_skills: List[RequiredSkillInput]


@strawberry.input
class JobSearchInput:
    keyword: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    limit: int = 20


@strawberry.input
class UserSkillInput:
    skill_id: int
    level: int


@strawberry.input
class ProjectInput:
    project_name: str
    description: str
    link: Optional[str] = None
    skill_ids: List[int]


@strawberry.input
class CertificateInput:
    certificate_name: str
    issuer: str
    issue_date: str
    skill_id: Optional[int] = None


@strawberry.input
class SoftSkillInput:
    soft_skill_name: str
    rating: int


@strawberry.input
class SkillCreateInput:
    skill_name: str


# Response types
@strawberry.type
class MessageResponse:
    message: str
    success: bool = True


@strawberry.type
class RegisterUserResponse:
    message: str
    user_id: int


@strawberry.type
class RegisterCompanyResponse:
    message: str
    company_id: int


@strawberry.type
class JobResponse:
    message: str
    job_id: int
    job: JobType


@strawberry.type
class UserSkillResponse:
    message: str
    skill: UserSkillType


@strawberry.type
class ProjectResponse:
    message: str
    project: ProjectType


@strawberry.type
class CertificateResponse:
    message: str
    certificate: CertificateType


@strawberry.type
class SkillResponse:
    message: str
    skill: SkillType


@strawberry.type
class ApplyJobResponse:
    message: str
    matching_score: int
    application: ApplicationType


@strawberry.type
class ApplicationStatusResponse:
    message: str
    application: ApplicationType


@strawberry.type
class ValidateCompanyResponse:
    message: str
    company: AdminCompanyType


@strawberry.type
class ValidateJobResponse:
    message: str
    job: AdminJobType


@strawberry.type
class UserActionResponse:
    message: str
    user: AdminUserType
