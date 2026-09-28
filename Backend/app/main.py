import os
import sys

# Mendapatkan jalur absolut dari direktori tempat berkas main.py ini berada
current_dir = os.path.dirname(os.path.abspath(__file__))
# Mendapatkan jalur induknya (yaitu folder Backend)
backend_dir = os.path.dirname(current_dir)

# Memasukkan folder Backend ke dalam sistem jalur pencarian Python jika belum terdaftar
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Baris perintah impormu yang sudah ada sebelumnya diletakkan setelah kode di atas
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from strawberry.fastapi import GraphQLRouter
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from time import sleep
from app.database import Base, engine, SessionLocal
from app.models import User, UserRole, Skill, Company, Job, JobStatus, JobRequiredSkill, UserSkill
from app.utils.security import hash_password, decode_token
from app.routes import auth, skills, profile, jobs, applications, admin
from app.graphql.schema import schema
# Note: REST imports kept for reference but routes are commented out

app = FastAPI(title="KerjoLe Backend API", version="1.0.0")


# GraphQL context - extracts user from Authorization header
async def get_context(request: Request):
    context = {"request": request}
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if payload:
            context["user_id"] = int(payload.get("sub"))
            context["role"] = payload.get("role")

    return context


# GraphQL router
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

# Melayani direktori /uploads secara statis
import os
import tempfile
UPLOAD_BASE_DIR = os.path.join(tempfile.gettempdir(), "uploads")
os.makedirs(os.path.join(UPLOAD_BASE_DIR, "cv"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_BASE_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kerjoleplatform.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST endpoints removed - GraphQL only
# app.include_router(auth.router)
# app.include_router(skills.router)
# app.include_router(profile.router)
# app.include_router(jobs.router)
# app.include_router(applications.router)
# app.include_router(admin.router)


def init_database():
    last_error = None
    for _ in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            seed_initial_data()
            return
        except OperationalError as exc:
            last_error = exc
            sleep(2)
    if last_error:
        raise last_error


def get_or_create_user(db: Session, full_name: str, email: str, password: str, role: UserRole, is_verified: bool = True):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        is_verified=is_verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_initial_data():
    db: Session = SessionLocal()
    try:
        admin = get_or_create_user(db, "Admin KerjoLe", "admin@kerjole.com", "admin12345", UserRole.admin, True)
        demo_user = get_or_create_user(db, "Budi Santoso", "user@kerjole.com", "user12345", UserRole.user, True)
        company_user = get_or_create_user(db, "TechCorp Indonesia", "company@kerjole.com", "company12345", UserRole.company, True)

        default_skills = ["Python", "JavaScript", "React", "FastAPI", "PostgreSQL", "Data Analysis", "Machine Learning", "SQL", "Docker", "UI/UX"]
        skill_map = {}
        for name in default_skills:
            skill = db.query(Skill).filter(Skill.skill_name == name).first()
            if not skill:
                skill = Skill(skill_name=name)
                db.add(skill)
                db.commit()
                db.refresh(skill)
            skill_map[name] = skill

        company = db.query(Company).filter(Company.user_id == company_user.id).first()
        if not company:
            company = Company(
                user_id=company_user.id,
                company_name="TechCorp Indonesia",
                address="Jakarta Selatan",
                description="Perusahaan teknologi yang fokus pada pengembangan aplikasi web dan data platform.",
                is_validated=True,
            )
            db.add(company)
            db.commit()
            db.refresh(company)
        else:
            company.is_validated = True
            db.commit()

        # Demo skill pelamar supaya dashboard setelah login langsung terlihat berbeda dan nyata.
        for skill_name, level in [("React", 4), ("Python", 3), ("SQL", 4)]:
            exists = db.query(UserSkill).filter(UserSkill.user_id == demo_user.id, UserSkill.skill_id == skill_map[skill_name].id).first()
            if not exists:
                db.add(UserSkill(user_id=demo_user.id, skill_id=skill_map[skill_name].id, level=level))
        db.commit()

        jobs_seed = [
            {
                "job_title": "Frontend Developer",
                "job_description": "Mengembangkan UI aplikasi KerjoLe berbasis React dan integrasi REST API.",
                "job_qualification": "Menguasai React, JavaScript, dan dasar UI/UX.",
                "location": "Jakarta / Remote",
                "salary_min": 7000000,
                "salary_max": 12000000,
                "job_type": "Full-Time",
                "skills": [("React", 3), ("JavaScript", 3)],
            },
            {
                "job_title": "Backend FastAPI Developer",
                "job_description": "Membangun API, autentikasi, database, dan scoring kandidat berbasis skill.",
                "job_qualification": "Menguasai Python, FastAPI, PostgreSQL, dan Docker.",
                "location": "Surakarta / Hybrid",
                "salary_min": 8000000,
                "salary_max": 14000000,
                "job_type": "Hybrid",
                "skills": [("Python", 3), ("FastAPI", 3), ("PostgreSQL", 3)],
            },
        ]
        for item in jobs_seed:
            job = db.query(Job).filter(Job.company_id == company.id, Job.job_title == item["job_title"]).first()
            if not job:
                job = Job(
                    company_id=company.id,
                    job_title=item["job_title"],
                    job_description=item["job_description"],
                    job_qualification=item["job_qualification"],
                    location=item["location"],
                    salary_min=item["salary_min"],
                    salary_max=item["salary_max"],
                    job_type=item["job_type"],
                    status=JobStatus.published,
                    is_validated=True,
                )
                db.add(job)
                db.commit()
                db.refresh(job)
                for skill_name, minimum_level in item["skills"]:
                    db.add(JobRequiredSkill(job_id=job.id, skill_id=skill_map[skill_name].id, minimum_level=minimum_level))
                db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    init_database()


@app.get("/")
def root():
    return {"message": "KerjoLe Backend API berjalan", "docs": "/docs"}
