# CareerCompass – Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ SESSION : "signs in with"
    USER ||--o{ MILESTONE : owns
    USER ||--o{ RESOURCE : saves
    USER ||--o{ USER_SKILL : rates
    USER ||--o{ ACTIVITY : generates
    USER }o--|| ROLE : "targets"
    USER ||--o{ SKILL : "creates (custom)"
    ROLE ||--|{ ROLE_REQUIREMENT : requires
    SKILL ||--o{ ROLE_REQUIREMENT : "appears in"
    SKILL ||--o{ USER_SKILL : "rated as"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        ObjectId targetRole FK
        string academicYear
        ObjectId[] customSkills FK
    }
    ROLE {
        ObjectId _id PK
        string name UK
        string description
        boolean isCustom
    }
    ROLE_REQUIREMENT {
        ObjectId skill FK
        string importance "critical | important"
    }
    SKILL {
        ObjectId _id PK
        string name
        string category
        ObjectId owner FK "null for built-in skills"
    }
    USER_SKILL {
        ObjectId _id PK
        ObjectId user FK
        ObjectId skill FK
        string status "not_started | in_progress | mastered"
    }
    MILESTONE {
        ObjectId _id PK
        ObjectId user FK
        string title
        string skillTag
        date dueDate
        string status "todo | in_progress | completed"
    }
    RESOURCE {
        ObjectId _id PK
        ObjectId user FK
        string title
        string url
        string type "video | article | documentation | certification"
        string skillTag
    }
    SESSION {
        ObjectId _id PK
        ObjectId user FK
        string device
        string location
        date expiresAt "TTL index"
    }
    ACTIVITY {
        ObjectId _id PK
        ObjectId user FK
        string message
        date createdAt
    }
```

`ROLE_REQUIREMENT` is an embedded sub-document inside `ROLE` (an array of `{ skill, importance }`).

## Design notes
- **Unique indexes:** `User.email`, `Role.name`, `UserSkill(user, skill)`, `Skill(name, owner)`.
- **Ownership:** every Milestone, Resource, UserSkill, Session and Activity stores `user`, and every query filters by it, so students can only touch their own data.
- **TTL index:** `Session.expiresAt` lets MongoDB delete expired sessions automatically.