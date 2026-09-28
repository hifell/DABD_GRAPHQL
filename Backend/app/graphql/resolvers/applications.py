import strawberry
from strawberry.types import Info
from typing import List

from app.graphql.types import (
    ApplicationType, ApplicationDetailType, ApplicantSkillType,
    ApplyJobResponse, ApplicationStatusResponse
)
from app.database import SessionLocal
from app.models import User, UserRole, Application, Job, JobStatus, UserSkill, Company, Certificate, Project
from app.services.scoring_service import calculate_matching_score
from sqlalchemy.orm import joinedload


def get_current_user(info: Info) -> User | None:
    ctx = info.context; user_id = ctx.get("user_id") if isinstance(ctx, dict) else getattr(ctx, "user_id", None)
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


def serialize_application(app: Application) -> ApplicationType:
    # Load relationships
    _ = app.user
    _ = app.job
    if app.job:
        _ = app.job.company
        _ = app.user.skills

    return ApplicationType(
        id=app.id,
        user_id=app.user_id,
        job_id=app.job_id,
        status=app.status.value if hasattr(app.status, "value") else str(app.status),
        matching_score=app.matching_score,
        applied_at=app.applied_at.isoformat() if app.applied_at else None,
        applicant_name=app.user.full_name if app.user else "-",
        applicant_email=app.user.email if app.user else "-",
        job_title=app.job.job_title if app.job else "-",
        company_name=app.job.company.company_name if app.job and app.job.company else "-",
        skills=[
            ApplicantSkillType(
                skill_name=s.skill.skill_name if s.skill else "-",
                level=s.level
            )
            for s in app.user.skills
        ] if app.user else []
    )


def serialize_application_detail(app: Application) -> ApplicationDetailType:
    # Load full relationships
    _ = app.user
    _ = app.job
    if app.job:
        _ = app.job.company
    _ = app.user.cv
    _ = app.user.skills
    _ = app.user.projects
    _ = app.user.certificates

    user = app.user
    cv_path = user.cv.file_path if user and user.cv else None
    cv_message = None if cv_path else "Pelamar belum mengupload CV"

    # Load certificate skills
    for c in user.certificates:
        _ = c.skill

    return ApplicationDetailType(
        id=app.id,
        user_id=app.user_id,
        job_id=app.job_id,
        status=app.status.value if hasattr(app.status, "value") else str(app.status),
        matching_score=app.matching_score,
        applied_at=app.applied_at.isoformat() if app.applied_at else None,
        applicant_name=user.full_name if user else "-",
        applicant_email=user.email if user else "-",
        cv_path=cv_path,
        cv_message=cv_message,
        skills=[
            ApplicantSkillType(
                skill_name=s.skill.skill_name if s.skill else "-",
                level=s.level
            )
            for s in user.skills
        ] if user else [],
        projects=[
            {
                "project_name": p.project_name,
                "description": p.description,
                "link": p.link
            }
            for p in user.projects
        ] if user else [],
        certificates=[
            {
                "certificate_name": c.certificate_name,
                "issuer": c.issuer,
                "issue_date": c.issue_date if c.issue_date else "",
                "skill_name": c.skill.skill_name if c.skill else None
            }
            for c in user.certificates
        ] if user else []
    )


@strawberry.type
class ApplicationsQuery:
    @strawberry.field
    def my_applications(self, info: Info) -> List[ApplicationType]:
        user = require_role(info, UserRole.user)

        db = SessionLocal()
        try:
            apps = db.query(Application).filter(
                Application.user_id == user.id
            ).order_by(Application.applied_at.desc()).all()

            return [serialize_application(app) for app in apps]
        finally:
            db.close()

    @strawberry.field
    def candidates(self, info: Info, job_id: int) -> List[ApplicationType]:
        user = require_role(info, UserRole.company)

        db = SessionLocal()
        try:
            company = db.query(Company).filter(Company.user_id == user.id).first()
            job = db.query(Job).filter(Job.id == job_id, Job.company_id == company.id).first()

            if not job:
                raise Exception("Lowongan tidak ditemukan")

            apps = db.query(Application).filter(
                Application.job_id == job_id
            ).order_by(Application.matching_score.desc()).all()

            return [serialize_application(app) for app in apps]
        finally:
            db.close()

    @strawberry.field
    def application_detail(self, info: Info, application_id: int) -> ApplicationDetailType:
        user = require_role(info, UserRole.company)

        db = SessionLocal()
        try:
            app = (
                db.query(Application)
                .options(
                    joinedload(Application.job),
                    joinedload(Application.user).options(
                        joinedload(User.cv),
                        joinedload(User.skills).joinedload(UserSkill.skill),
                        joinedload(User.projects),
                        joinedload(User.certificates).joinedload(Certificate.skill),
                    )
                )
                .filter(Application.id == application_id)
                .first()
            )

            if not app:
                raise Exception("Lamaran tidak ditemukan")

            company = db.query(Company).filter(Company.user_id == user.id).first()
            if app.job.company_id != company.id:
                raise Exception("Akses ditolak")

            return serialize_application_detail(app)
        finally:
            db.close()


@strawberry.type
class ApplicationsMutation:
    @strawberry.mutation
    def apply_job(self, info: Info, job_id: int) -> ApplyJobResponse:
        user = require_role(info, UserRole.user)

        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()

            if not job or job.status != JobStatus.published or not job.is_validated:
                raise Exception("Lowongan tidak aktif atau belum divalidasi")

            if job.expired_date and job.expired_date < datetime.utcnow():
                raise Exception("Lowongan sudah ditutup")

            existing = db.query(Application).filter(
                Application.user_id == user.id,
                Application.job_id == job_id
            ).first()
            if existing:
                raise Exception("User sudah pernah melamar lowongan ini")

            skill_count = db.query(UserSkill).filter(UserSkill.user_id == user.id).count()
            if skill_count < 1:
                raise Exception("Profil kompetensi kosong. Tambahkan minimal 1 hard skill dulu.")

            score = calculate_matching_score(db, user.id, job_id)
            application = Application(
                user_id=user.id,
                job_id=job_id,
                matching_score=score
            )
            db.add(application)
            db.commit()
            db.refresh(application)

            return ApplyJobResponse(
                message="Lamaran berhasil dikirim",
                matching_score=score,
                application=serialize_application(application)
            )
        finally:
            db.close()

    @strawberry.mutation
    def update_application_status(
        self, info: Info, application_id: int, status: str
    ) -> ApplicationStatusResponse:
        user = require_role(info, UserRole.company)

        db = SessionLocal()
        try:
            if status not in ["accepted", "rejected", "pending"]:
                raise Exception("Status tidak valid")

            app = db.query(Application).filter(Application.id == application_id).first()
            if not app:
                raise Exception("Lamaran tidak ditemukan")

            company = db.query(Company).filter(Company.user_id == user.id).first()
            if app.job.company_id != company.id:
                raise Exception("Akses ditolak")

            app.status = status
            db.commit()
            db.refresh(app)

            return ApplicationStatusResponse(
                message="Status lamaran berhasil diperbarui",
                application=serialize_application(app)
            )
        finally:
            db.close()


# Import datetime for the mutation
from datetime import datetime
