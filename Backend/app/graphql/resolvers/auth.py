import strawberry
from strawberry.types import Info
from sqlalchemy.orm import Session

from app.graphql.types import (
    UserType, LoginResponse, LoginInput, RegisterUserInput,
    RegisterUserResponse, RegisterCompanyInput, RegisterCompanyResponse,
    CompanyType, Role, MessageResponse
)
from app.database import SessionLocal
from app.models import User, Company, UserRole
from app.utils.security import hash_password, verify_password, create_access_token


def user_to_graphql(user: User) -> UserType:
    company = None
    if user.company:
        company = CompanyType(
            id=user.company.id,
            company_name=user.company.company_name,
            address=user.company.address,
            description=user.company.description,
            is_validated=user.company.is_validated,
            logo_path=user.company.logo_path
        )

    role_map = {
        UserRole.user: Role.USER,
        UserRole.company: Role.COMPANY,
        UserRole.admin: Role.ADMIN
    }

    return UserType(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=role_map.get(user.role, Role.USER),
        is_verified=user.is_verified,
        is_locked=user.is_locked,
        company=company
    )


def get_current_user_id(info: Info) -> int | None:
    ctx = info.context
    if isinstance(ctx, dict):
        return ctx.get("user_id")
    return getattr(ctx, "user_id", None)


def get_current_user_role(info: Info) -> str | None:
    ctx = info.context
    if isinstance(ctx, dict):
        return ctx.get("role")
    return getattr(ctx, "role", None)


@strawberry.type
class AuthQuery:
    @strawberry.field
    def me(self, info: Info) -> UserType:
        user_id = get_current_user_id(info)
        if not user_id:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise Exception("User not found")
            return user_to_graphql(user)
        finally:
            db.close()


@strawberry.type
class AuthMutation:
    @strawberry.mutation
    def login(self, input: LoginInput) -> LoginResponse:
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == input.email).first()

            if not user:
                raise Exception("Email atau password salah")

            if user.is_locked:
                raise Exception("Akun terkunci karena 5 kali gagal login")

            if not verify_password(input.password, user.password_hash):
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 5:
                    user.is_locked = True
                db.commit()
                raise Exception("Email atau password salah")

            user.failed_login_attempts = 0
            db.commit()

            token = create_access_token({"sub": str(user.id), "role": user.role.value})

            role_map = {
                UserRole.user: Role.USER,
                UserRole.company: Role.COMPANY,
                UserRole.admin: Role.ADMIN
            }

            return LoginResponse(
                access_token=token,
                token_type="bearer",
                role=role_map.get(user.role, Role.USER)
            )
        finally:
            db.close()

    @strawberry.mutation
    def register_user(self, input: RegisterUserInput) -> RegisterUserResponse:
        db = SessionLocal()
        try:
            if db.query(User).filter(User.email == input.email).first():
                raise Exception("Email sudah terdaftar")

            user = User(
                full_name=input.full_name,
                email=input.email,
                password_hash=hash_password(input.password),
                role=UserRole.user,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            return RegisterUserResponse(
                message="Registrasi pelamar berhasil",
                user_id=user.id
            )
        finally:
            db.close()

    @strawberry.mutation
    def register_company(self, input: RegisterCompanyInput) -> RegisterCompanyResponse:
        db = SessionLocal()
        try:
            if db.query(User).filter(User.email == input.email).first():
                raise Exception("Email sudah terdaftar")

            user = User(
                full_name=input.company_name,
                email=input.email,
                password_hash=hash_password(input.password),
                role=UserRole.company,
                is_verified=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            company = Company(
                user_id=user.id,
                company_name=input.company_name,
                address=input.address,
                description=input.description,
                is_validated=False,
            )
            db.add(company)
            db.commit()
            db.refresh(company)

            return RegisterCompanyResponse(
                message="Registrasi perusahaan berhasil, menunggu validasi admin",
                company_id=company.id
            )
        finally:
            db.close()

    @strawberry.mutation
    def logout(self) -> MessageResponse:
        return MessageResponse(message="Logout berhasil")
