import strawberry
from strawberry.types import Info
from typing import List, Optional

from app.graphql.types import (
    JobType, JobCreateInput, JobResponse, CompanyJobsResponse,
    CompanyType, RequiredSkillType, JobStatusEnum
)
from app.database import SessionLocal
from app.models import User, UserRole, Company, Job, JobRequiredSkill, JobStatus, UserSkill
from datetime import datetime


def job_to_graphql(job: Job) -> JobType:
    return JobType(
        id=job.id,
        company_id=job.company_id,
        company_name=job.company.company_name if job.company else "-",
        job_title=job.job_title,
        job_description=job.job_description,
        job_qualification=job.job_qualification,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        job_type=job.job_type,
        status=JobStatusEnum[job.status.value.upper()] if hasattr(job.status, "value") else JobStatusEnum[job.status.name.upper()],
        expired_date=job.expired_date.isoformat() if job.expired_date else None,
        is_validated=job.is_validated,
        created_at=job.created_at.isoformat() if job.created_at else None,
        required_skills=[
            RequiredSkillType(
                id=rs.id,
                skill_id=rs.skill_id,
                skill_name=rs.skill.skill_name if rs.skill else "-",
                minimum_level=rs.minimum_level
            )
            for rs in job.required_skills
        ],
        total_applicants=len(job.applications)
    )


def get_current_user(info: Info) -> User | None:
    ctx = info.context
    user_id = ctx.get("user_id") if isinstance(ctx, dict) else getattr(ctx, "user_id", None)
    if not user_id:
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()


def require_role(info: Info, *roles: UserRole) -> User:
    user = get_current_user(info)
    if not user:
        raise Exception("Authentication required")
    if user.role not in roles:
        raise Exception("Akses ditolak untuk role ini")
    return user


@strawberry.type
class JobsQuery:
    @strawberry.field
    def jobs(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 20
    ) -> List[JobType]:
        db = SessionLocal()
        try:
            from sqlalchemy import or_

            query = (
                db.query(Job)
                .filter(
                    Job.status == JobStatus.published,
                    Job.is_validated == True,
                )
            )

            if keyword and keyword.strip():
                search = f"%{keyword.strip()}%"
                query = query.filter(
                    or_(
                        Job.job_title.ilike(search),
                        Job.job_description.ilike(search),
                        Job.job_qualification.ilike(search),
                    )
                ).join(Company, Job.company_id == Company.id).filter(
                    or_(Company.company_name.ilike(search))
                )

            if location and location.strip():
                query = query.filter(Job.location.ilike(f"%{location.strip()}%"))

            if job_type and job_type.strip():
                query = query.filter(Job.job_type.ilike(f"%{job_type.strip()}%"))

            jobs = query.all()
            for job in jobs:
                _ = job.company
                _ = job.required_skills
                _ = job.applications

            return [job_to_graphql(job) for job in jobs[:limit]]
        finally:
            db.close()

    @strawberry.field
    def recommended_jobs(self, info: Info, limit: int = 6) -> List[JobType]:
        ctx = info.context
        user_id = ctx.get("user_id") if isinstance(ctx, dict) else getattr(ctx, "user_id", None)
        if not user_id:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role != UserRole.user:
                raise Exception("Authentication required")

            # Load user skills while session is open
            user_skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
            user_skill_ids = [s.skill_id for s in user_skills]

            jobs = (
                db.query(Job)
                .filter(
                    Job.status == JobStatus.published,
                    Job.is_validated == True,
                )
                .all()
            )

            for job in jobs:
                _ = job.company
                _ = job.required_skills
                _ = job.applications

            if user_skill_ids:
                jobs = sorted(
                    jobs,
                    key=lambda job: len(
                        set(user_skill_ids)
                        & set(required.skill_id for required in job.required_skills)
                    ),
                    reverse=True,
                )

            return [job_to_graphql(job) for job in jobs[:limit]]
        finally:
            db.close()

    @strawberry.field
    def my_company_jobs(self, info: Info) -> CompanyJobsResponse:
        user = require_role(info, UserRole.company)

        db = SessionLocal()
        try:
            company = db.query(Company).filter(Company.user_id == user.id).first()

            if not company:
                raise Exception("Data perusahaan tidak ditemukan")

            jobs = (
                db.query(Job)
                .filter(Job.company_id == company.id)
                .all()
            )

            for job in jobs:
                _ = job.company
                _ = job.required_skills
                _ = job.applications

            return CompanyJobsResponse(
                company=CompanyType(
                    id=company.id,
                    company_name=company.company_name,
                    address=company.address,
                    description=company.description,
                    is_validated=company.is_validated,
                    logo_path=company.logo_path
                ),
                jobs=[job_to_graphql(job) for job in jobs]
            )
        finally:
            db.close()

    @strawberry.field
    def job(self, id: int) -> JobType:
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == id).first()

            if not job:
                raise Exception("Lowongan tidak ditemukan")

            _ = job.company
            _ = job.required_skills
            _ = job.applications

            return job_to_graphql(job)
        finally:
            db.close()


@strawberry.type
class JobsMutation:
    @strawberry.mutation
    def create_job(self, info: Info, input: JobCreateInput) -> JobResponse:
        user = require_role(info, UserRole.company)

        db = SessionLocal()
        try:
            company = db.query(Company).filter(Company.user_id == user.id).first()

            if not company:
                raise Exception("Data perusahaan tidak ditemukan")

            if not company.is_validated:
                raise Exception("Akun perusahaan belum divalidasi admin")

            if len(input.job_title) > 100:
                raise Exception("Judul lowongan maksimal 100 karakter")

            if not input.job_description.strip():
                raise Exception("Deskripsi pekerjaan wajib diisi")

            if not input.job_qualification.strip():
                raise Exception("Kualifikasi pekerjaan wajib diisi")

            if not input.required_skills:
                raise Exception("Lowongan wajib memiliki minimal 1 skill")

            if len(input.required_skills) > 5:
                raise Exception("Required skill maksimal 5")

            if input.expired_date and input.expired_date < datetime.utcnow():
                raise Exception("Tanggal kedaluwarsa tidak valid")

            status_value = input.status if input.status in ["draft", "published", "closed"] else "draft"

            job = Job(
                company_id=company.id,
                job_title=input.job_title,
                job_description=input.job_description,
                job_qualification=input.job_qualification,
                location=input.location,
                salary_min=input.salary_min,
                salary_max=input.salary_max,
                job_type=input.job_type,
                status=JobStatus(status_value),
                expired_date=input.expired_date,
                is_validated=False,
            )

            db.add(job)
            db.commit()
            db.refresh(job)

            for required in input.required_skills:
                db.add(
                    JobRequiredSkill(
                        job_id=job.id,
                        skill_id=required.skill_id,
                        minimum_level=required.minimum_level,
                    )
                )

            db.commit()
            db.refresh(job)

            _ = job.company
            _ = job.required_skills
            _ = job.applications

            return JobResponse(
                message="Lowongan berhasil dibuat, menunggu validasi admin",
                job_id=job.id,
                job=job_to_graphql(job)
            )
        finally:
            db.close()

    @strawberry.mutation
    def close_job(self, info: Info, job_id: int) -> JobResponse:
        user = require_role(info, UserRole.company)

        db = SessionLocal()
        try:
            company = db.query(Company).filter(Company.user_id == user.id).first()

            if not company:
                raise Exception("Data perusahaan tidak ditemukan")

            job = db.query(Job).filter(Job.id == job_id, Job.company_id == company.id).first()

            if not job:
                raise Exception("Lowongan tidak ditemukan")

            job.status = JobStatus.closed
            db.commit()
            db.refresh(job)

            _ = job.company
            _ = job.required_skills
            _ = job.applications

            return JobResponse(
                message="Lowongan berhasil ditutup",
                job_id=job.id,
                job=job_to_graphql(job)
            )
        finally:
            db.close()
