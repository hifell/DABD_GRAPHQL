import strawberry
from strawberry.types import Info
from typing import List, Optional

from app.graphql.types import (
    ProfileOverviewType, UserSkillType, UserSkillInput, UserSkillResponse,
    ProjectType, ProjectInput, ProjectResponse,
    CertificateType, CertificateInput, CertificateResponse,
    SoftSkillType, SoftSkillInput,
    CVType, MessageResponse, UserBasicType, Role
)
from app.database import SessionLocal
from app.models import User, UserRole, UserSkill, Project, ProjectSkill, Certificate, SoftSkill, CV


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


def require_user_role(info: Info) -> User:
    user = get_current_user(info)
    if not user:
        raise Exception("Authentication required")
    if user.role != UserRole.user:
        raise Exception("Akses ditolak untuk role ini")
    return user


@strawberry.type
class ProfileQuery:
    @strawberry.field
    def profile_overview(self, info: Info) -> ProfileOverviewType:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user.id).first()

            applications = [
                {
                    "id": app.id,
                    "job_id": app.job_id,
                    "job_title": app.job.job_title if app.job else "-",
                    "company_name": app.job.company.company_name if app.job and app.job.company else "-",
                    "status": app.status.value if hasattr(app.status, "value") else str(app.status),
                    "matching_score": app.matching_score,
                    "applied_at": app.applied_at.isoformat() if app.applied_at else None,
                }
                for app in user.applications
            ]

            _ = user.skills
            _ = user.projects
            _ = user.certificates
            _ = user.soft_skills
            _ = user.cv

            role_map = {
                UserRole.user: Role.USER,
                UserRole.company: Role.COMPANY,
                UserRole.admin: Role.ADMIN
            }

            return ProfileOverviewType(
                user=UserBasicType(
                    id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    role=role_map.get(user.role, Role.USER)
                ),
                skills=[
                    UserSkillType(
                        id=s.id,
                        skill_id=s.skill_id,
                        skill_name=s.skill.skill_name if s.skill else "-",
                        level=s.level
                    )
                    for s in user.skills
                ],
                projects=[
                    ProjectType(
                        project_name=p.project_name,
                        description=p.description,
                        link=p.link
                    )
                    for p in user.projects
                ],
                certificates=[
                    CertificateType(
                        certificate_name=c.certificate_name,
                        issuer=c.issuer,
                        issue_date=c.issue_date if c.issue_date else "",
                        skill_name=c.skill.skill_name if c.skill else None
                    )
                    for c in user.certificates
                ],
                soft_skills=[
                    SoftSkillType(
                        id=s.id,
                        soft_skill_name=s.soft_skill_name,
                        rating=s.rating
                    )
                    for s in user.soft_skills
                ],
                cv=CVType(
                    file_path=user.cv.file_path,
                    uploaded_at=user.cv.uploaded_at.isoformat()
                ) if user.cv else None,
                applications=applications
            )
        finally:
            db.close()

    @strawberry.field
    def my_skills(self, info: Info) -> List[UserSkillType]:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

            for skill in skills:
                _ = skill.skill

            return [
                UserSkillType(
                    id=s.id,
                    skill_id=s.skill_id,
                    skill_name=s.skill.skill_name if s.skill else "-",
                    level=s.level
                )
                for s in skills
            ]
        finally:
            db.close()

    @strawberry.field
    def my_projects(self, info: Info) -> List[ProjectType]:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            projects = db.query(Project).filter(Project.user_id == user.id).all()

            for p in projects:
                _ = p.project_skills

            return [
                ProjectType(
                    project_name=p.project_name,
                    description=p.description,
                    link=p.link
                )
                for p in projects
            ]
        finally:
            db.close()

    @strawberry.field
    def my_certificates(self, info: Info) -> List[CertificateType]:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            certs = db.query(Certificate).filter(Certificate.user_id == user.id).all()

            for c in certs:
                _ = c.skill

            return [
                CertificateType(
                    certificate_name=c.certificate_name,
                    issuer=c.issuer,
                    issue_date=c.issue_date if c.issue_date else "",
                    skill_name=c.skill.skill_name if c.skill else None
                )
                for c in certs
            ]
        finally:
            db.close()


@strawberry.type
class ProfileMutation:
    @strawberry.mutation
    def add_skill(self, info: Info, input: UserSkillInput) -> UserSkillResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            total = db.query(UserSkill).filter(UserSkill.user_id == user.id).count()
            if total >= 10:
                raise Exception("Hard skill maksimal 10")

            exists = db.query(UserSkill).filter(
                UserSkill.user_id == user.id,
                UserSkill.skill_id == input.skill_id
            ).first()
            if exists:
                raise Exception("Skill sudah ada di profil")

            item = UserSkill(user_id=user.id, skill_id=input.skill_id, level=input.level)
            db.add(item)
            db.commit()
            db.refresh(item)
            _ = item.skill

            return UserSkillResponse(
                message="Hard skill berhasil ditambahkan",
                skill=UserSkillType(
                    id=item.id,
                    skill_id=item.skill_id,
                    skill_name=item.skill.skill_name if item.skill else "-",
                    level=item.level
                )
            )
        finally:
            db.close()

    @strawberry.mutation
    def delete_skill(self, info: Info, user_skill_id: int) -> MessageResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            item = db.query(UserSkill).filter(
                UserSkill.id == user_skill_id,
                UserSkill.user_id == user.id
            ).first()
            if not item:
                raise Exception("Skill profil tidak ditemukan")

            db.delete(item)
            db.commit()

            return MessageResponse(message="Hard skill berhasil dihapus")
        finally:
            db.close()

    @strawberry.mutation
    def add_project(self, info: Info, input: ProjectInput) -> ProjectResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            total = db.query(Project).filter(Project.user_id == user.id).count()
            if total >= 10:
                raise Exception("Project maksimal 10")

            if not input.skill_ids:
                raise Exception("Project wajib menautkan minimal 1 skill")

            project = Project(
                user_id=user.id,
                project_name=input.project_name,
                description=input.description,
                link=input.link
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            for skill_id in input.skill_ids:
                db.add(ProjectSkill(project_id=project.id, skill_id=skill_id))
            db.commit()

            return ProjectResponse(
                message="Project berhasil ditambahkan",
                project=ProjectType(
                    project_name=project.project_name,
                    description=project.description,
                    link=project.link
                )
            )
        finally:
            db.close()

    @strawberry.mutation
    def delete_project(self, info: Info, project_id: int) -> MessageResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            project = db.query(Project).filter(
                Project.id == project_id,
                Project.user_id == user.id
            ).first()
            if not project:
                raise Exception("Project tidak ditemukan")

            db.delete(project)
            db.commit()

            return MessageResponse(message="Project berhasil dihapus")
        finally:
            db.close()

    @strawberry.mutation
    def add_certificate(self, info: Info, input: CertificateInput) -> CertificateResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            total = db.query(Certificate).filter(Certificate.user_id == user.id).count()
            if total >= 5:
                raise Exception("Sertifikat maksimal 5")

            cert = Certificate(
                user_id=user.id,
                certificate_name=input.certificate_name,
                issuer=input.issuer,
                issue_date=input.issue_date,
                skill_id=input.skill_id
            )
            db.add(cert)
            db.commit()
            db.refresh(cert)
            _ = cert.skill

            return CertificateResponse(
                message="Sertifikat berhasil ditambahkan",
                certificate=CertificateType(
                    certificate_name=cert.certificate_name,
                    issuer=cert.issuer,
                    issue_date=cert.issue_date if cert.issue_date else "",
                    skill_name=cert.skill.skill_name if cert.skill else None
                )
            )
        finally:
            db.close()

    @strawberry.mutation
    def delete_certificate(self, info: Info, certificate_id: int) -> MessageResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            cert = db.query(Certificate).filter(
                Certificate.id == certificate_id,
                Certificate.user_id == user.id
            ).first()
            if not cert:
                raise Exception("Sertifikat tidak ditemukan")

            db.delete(cert)
            db.commit()

            return MessageResponse(message="Sertifikat berhasil dihapus")
        finally:
            db.close()

    @strawberry.mutation
    def add_soft_skill(self, info: Info, input: SoftSkillInput) -> MessageResponse:
        user = require_user_role(info)

        db = SessionLocal()
        try:
            item = SoftSkill(
                user_id=user.id,
                soft_skill_name=input.soft_skill_name,
                rating=input.rating
            )
            db.add(item)
            db.commit()

            return MessageResponse(message="Soft skill berhasil ditambahkan")
        finally:
            db.close()
