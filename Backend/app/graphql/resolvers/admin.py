import strawberry
from strawberry.types import Info
from typing import List

from app.graphql.types import (
    AdminCompanyType, AdminJobType, AdminUserType,
    ValidateCompanyResponse, ValidateJobResponse, UserActionResponse,
    MessageResponse
)
from app.database import SessionLocal
from app.models import User, UserRole, Company, Job


def get_current_user(info: Info) -> User | None:
    ctx = info.context; user_id = ctx.get("user_id") if isinstance(ctx, dict) else getattr(ctx, "user_id", None)
    if not user_id:
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()


def require_admin(info: Info) -> User:
    user = get_current_user(info)
    if not user:
        raise Exception("Authentication required")
    if user.role != UserRole.admin:
        raise Exception("Admin access required")
    return user


def serialize_company(company: Company) -> AdminCompanyType:
    return AdminCompanyType(
        id=company.id,
        company_name=company.company_name,
        address=company.address,
        description=company.description,
        is_validated=company.is_validated,
        owner_name=company.user.full_name if company.user else "-",
        owner_email=company.user.email if company.user else "-",
        created_at=company.user.created_at.isoformat() if company.user and company.user.created_at else None
    )


def serialize_job(job: Job) -> AdminJobType:
    return AdminJobType(
        id=job.id,
        job_title=job.job_title,
        job_description=job.job_description,
        company_name=job.company.company_name if job.company else "-",
        company_id=job.company_id,
        location=job.location,
        job_type=job.job_type,
        status=job.status.value if hasattr(job.status, "value") else str(job.status),
        is_validated=job.is_validated,
        created_at=job.created_at.isoformat() if job.created_at else None
    )


def serialize_user(user: User) -> AdminUserType:
    return AdminUserType(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_verified=user.is_verified,
        is_locked=user.is_locked,
        created_at=user.created_at.isoformat() if user.created_at else None
    )


@strawberry.type
class AdminQuery:
    @strawberry.field
    def pending_companies(self, info: Info) -> List[AdminCompanyType]:
        require_admin(info)

        db = SessionLocal()
        try:
            companies = db.query(Company).filter(Company.is_validated == False).all()

            # Load relationships
            for c in companies:
                _ = c.user

            return [serialize_company(c) for c in companies]
        finally:
            db.close()

    @strawberry.field
    def pending_jobs(self, info: Info) -> List[AdminJobType]:
        require_admin(info)

        db = SessionLocal()
        try:
            jobs = db.query(Job).filter(Job.is_validated == False).all()

            # Load relationships
            for j in jobs:
                _ = j.company

            return [serialize_job(j) for j in jobs]
        finally:
            db.close()

    @strawberry.field
    def users(self, info: Info) -> List[AdminUserType]:
        require_admin(info)

        db = SessionLocal()
        try:
            users = db.query(User).all()
            return [serialize_user(u) for u in users]
        finally:
            db.close()

    @strawberry.field
    def user(self, info: Info, user_id: int) -> AdminUserType:
        require_admin(info)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise Exception("User tidak ditemukan")
            return serialize_user(user)
        finally:
            db.close()


@strawberry.type
class AdminMutation:
    @strawberry.mutation
    def validate_company(self, info: Info, company_id: int) -> ValidateCompanyResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            company = db.query(Company).filter(Company.id == company_id).first()
            if not company:
                raise Exception("Perusahaan tidak ditemukan")

            company.is_validated = True
            company.user.is_verified = True
            db.commit()
            db.refresh(company)
            _ = company.user

            return ValidateCompanyResponse(
                message="Perusahaan berhasil divalidasi",
                company=serialize_company(company)
            )
        finally:
            db.close()

    @strawberry.mutation
    def reject_company(self, info: Info, company_id: int) -> MessageResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            company = db.query(Company).filter(Company.id == company_id).first()
            if not company:
                raise Exception("Perusahaan tidak ditemukan")

            if company.is_validated:
                raise Exception("Perusahaan sudah divalidasi, tidak dapat ditolak")

            # Lock user account
            company.user.is_locked = True
            db.delete(company)
            db.commit()

            return MessageResponse(message="Perusahaan ditolak dan akun dikunci")
        finally:
            db.close()

    @strawberry.mutation
    def validate_job(self, info: Info, job_id: int) -> ValidateJobResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            from app.models import JobStatus as JobStatusEnum

            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                raise Exception("Lowongan tidak ditemukan")

            job.is_validated = True
            job.status = JobStatusEnum.published
            db.commit()
            db.refresh(job)
            _ = job.company

            return ValidateJobResponse(
                message="Lowongan berhasil divalidasi dan dipublish",
                job=serialize_job(job)
            )
        finally:
            db.close()

    @strawberry.mutation
    def reject_job(self, info: Info, job_id: int) -> MessageResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                raise Exception("Lowongan tidak ditemukan")

            if job.is_validated:
                raise Exception("Lowongan sudah divalidasi, tidak dapat ditolak")

            db.delete(job)
            db.commit()

            return MessageResponse(message="Lowongan ditolak dan dihapus")
        finally:
            db.close()

    @strawberry.mutation
    def lock_user(self, info: Info, user_id: int) -> UserActionResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise Exception("User tidak ditemukan")

            if user.role == UserRole.admin:
                raise Exception("Tidak dapat mengunci akun admin")

            user.is_locked = True
            db.commit()
            db.refresh(user)

            return UserActionResponse(
                message="Akun user berhasil dikunci",
                user=serialize_user(user)
            )
        finally:
            db.close()

    @strawberry.mutation
    def unlock_user(self, info: Info, user_id: int) -> UserActionResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise Exception("User tidak ditemukan")

            user.is_locked = False
            db.commit()
            db.refresh(user)

            return UserActionResponse(
                message="Akun user berhasil dibuka",
                user=serialize_user(user)
            )
        finally:
            db.close()

    @strawberry.mutation
    def verify_user(self, info: Info, user_id: int) -> UserActionResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise Exception("User tidak ditemukan")

            user.is_verified = True
            db.commit()
            db.refresh(user)

            return UserActionResponse(
                message="Akun user berhasil diverifikasi",
                user=serialize_user(user)
            )
        finally:
            db.close()
