# CareerCompass

CareerCompass helps students plan their path to a tech role. You rate your skills against a target role, see which critical skills you are missing, plan learning tasks on a board and save useful links.

Built for EC4307 Web Application Development with MongoDB, Express, React and Node.js, all in TypeScript.

## Features
- Register and log in (JWT, with "remember me")
- Skill Gap Assessor: mark each required skill as Not started, In progress or Mastered
- Readiness score shown on the dashboard
- Milestones Board: add, edit, delete and drag milestones between To do, In progress and Completed
- Resource Hub: save, search, filter, sort, edit and delete learning links
- Profile settings: update account details, custom role skills, change password, manage sessions

## Tech stack
- Frontend: React, TypeScript, Vite, React Router, Axios
- Backend: Node.js, Express, TypeScript, Mongoose, zod
- Database: MongoDB

## Project structure
```
career-compass/
├── frontend/   React app
├── backend/    Express API
└── docs/       ERD and screenshots
```

## How to run
You need Node.js 18+ and MongoDB running locally (or a MongoDB Atlas connection string).

1. Clone the repository and open the folder.
2. Backend:
```bash
   cd backend
   npm install
```
   Create `backend/.env` using `backend/.env.example` as a guide, then start the server:
```bash
   npm run dev
```
   The API runs at http://localhost:5000.
3. Frontend (in a second terminal):
```bash
   cd frontend
   npm install
   npm run dev
```
   Open http://localhost:5173.

## Database design
See the ERD in [docs/ERD.md](docs/ERD.md).

## Main API routes
| Method | Route | Purpose |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Create account, log in |
| GET / PUT | /api/assessment, /api/assessment/:skillId | View and update skill levels |
| GET / POST | /api/milestones | List and create milestones |
| PUT / PATCH / DELETE | /api/milestones/:id | Edit, move, delete a milestone |
| GET / POST | /api/resources | List (search, filter, sort) and create resources |
| PUT / DELETE | /api/resources/:id | Edit and delete a resource |
| GET | /api/dashboard | Readiness score and recent activity |
| GET / PATCH | /api/profile | View and update account details |

## Readiness score
Critical skills count double. Mastered counts as 100%, In progress as 50% and Not started as 0%. The score is the points earned divided by the total points available.

## Screenshots
![Landing page](docs/screenshots/landing.png)
![Dashboard](docs/screenshots/dashboard.png)
![Skill Gap Assessor](docs/screenshots/assessor.png)
![Milestones Board](docs/screenshots/milestones.png)
![Resource Hub](docs/screenshots/resources.png)
![Profile Settings](docs/screenshots/profile.png)

## What I learned
[Write 3 or 4 sentences in your own words: what was hardest, what you fixed, what you would improve.]

## Author
[Your name] · [Index number] · EC4307 Web Application Development