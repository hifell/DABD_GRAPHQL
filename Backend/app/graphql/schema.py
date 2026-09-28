import strawberry
from strawberry.fastapi import GraphQLRouter

from app.graphql.resolvers.auth import AuthQuery, AuthMutation
from app.graphql.resolvers.jobs import JobsQuery, JobsMutation
from app.graphql.resolvers.profile import ProfileQuery, ProfileMutation
from app.graphql.resolvers.applications import ApplicationsQuery, ApplicationsMutation
from app.graphql.resolvers.skills import SkillsQuery, SkillsMutation
from app.graphql.resolvers.admin import AdminQuery, AdminMutation


@strawberry.type
class Query(
    AuthQuery,
    JobsQuery,
    ProfileQuery,
    ApplicationsQuery,
    SkillsQuery,
    AdminQuery
):
    pass


@strawberry.type
class Mutation(
    AuthMutation,
    JobsMutation,
    ProfileMutation,
    ApplicationsMutation,
    SkillsMutation,
    AdminMutation
):
    pass


schema = strawberry.Schema(query=Query, mutation=Mutation)
