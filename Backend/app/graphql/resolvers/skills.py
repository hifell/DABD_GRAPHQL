import strawberry
from strawberry.types import Info
from typing import List

from app.graphql.types import (
    SkillType, SkillCreateInput, MessageResponse, SkillResponse
)
from app.database import SessionLocal
from app.models import User, UserRole, Skill


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


@strawberry.type
class SkillsQuery:
    @strawberry.field
    def skills(self) -> List[SkillType]:
        db = SessionLocal()
        try:
            skills = db.query(Skill).filter(
                Skill.is_active == True
            ).order_by(Skill.skill_name.asc()).all()

            return [
                SkillType(
                    id=s.id,
                    skill_name=s.skill_name,
                    is_active=s.is_active
                )
                for s in skills
            ]
        finally:
            db.close()


@strawberry.type
class SkillsMutation:
    @strawberry.mutation
    def create_skill(self, info: Info, input: SkillCreateInput) -> SkillResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            exists = db.query(Skill).filter(Skill.skill_name == input.skill_name).first()
            if exists:
                raise Exception("Nama skill duplikat")

            skill = Skill(skill_name=input.skill_name)
            db.add(skill)
            db.commit()
            db.refresh(skill)

            return SkillResponse(
                message="Skill berhasil dibuat",
                skill=SkillType(
                    id=skill.id,
                    skill_name=skill.skill_name,
                    is_active=skill.is_active
                )
            )
        finally:
            db.close()

    @strawberry.mutation
    def deactivate_skill(self, info: Info, skill_id: int) -> MessageResponse:
        require_admin(info)

        db = SessionLocal()
        try:
            skill = db.query(Skill).filter(Skill.id == skill_id).first()
            if not skill:
                raise Exception("Skill tidak ditemukan")

            skill.is_active = False
            db.commit()

            return MessageResponse(message="Skill berhasil dinonaktifkan")
        finally:
            db.close()
