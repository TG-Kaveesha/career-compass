import { Types } from "mongoose";
import { connectDB } from "./config/db";
import { Role } from "./models/Role";
import { Skill } from "./models/Skill";

type Imp = "critical" | "important";

const SKILLS: [string, string][] = [
  ["HTML/CSS", "Frontend"],
  ["JavaScript", "Frontend"],
  ["TypeScript", "Frontend"],
  ["React", "Frontend"],
  ["Accessibility", "Frontend"],
  ["Node.js", "Backend"],
  ["REST APIs", "Backend"],
  ["Testing", "Backend"],
  ["SQL", "Database"],
  ["MongoDB", "Database"],
  ["Git", "DevOps"],
  ["Docker", "DevOps"],
  ["Python", "Data"],
  ["Data Visualization", "Data"],
];

const ROLES: { name: string; description: string; skills: [string, Imp][] }[] = [
  {
    name: "Junior Web Developer",
    description: "Builds and maintains full-stack web features.",
    skills: [
      ["HTML/CSS", "critical"], ["React", "critical"], ["Accessibility", "important"],
      ["Node.js", "critical"], ["REST APIs", "critical"], ["SQL", "critical"],
      ["MongoDB", "important"], ["Git", "critical"], ["Docker", "important"],
    ],
  },
  {
    name: "Frontend Developer",
    description: "Creates responsive, accessible user interfaces.",
    skills: [
      ["HTML/CSS", "critical"], ["JavaScript", "critical"], ["TypeScript", "important"],
      ["React", "critical"], ["Accessibility", "important"], ["Testing", "important"], ["Git", "critical"],
    ],
  },
  {
    name: "Backend Developer",
    description: "Designs APIs, databases and server logic.",
    skills: [
      ["Node.js", "critical"], ["REST APIs", "critical"], ["SQL", "critical"], ["MongoDB", "important"],
      ["Testing", "important"], ["Docker", "important"], ["Git", "critical"],
    ],
  },
  {
    name: "Data Analyst",
    description: "Turns raw data into decisions.",
    skills: [
      ["SQL", "critical"], ["Python", "critical"], ["Data Visualization", "critical"], ["Git", "important"],
    ],
  },
];
export async function seedRoles(): Promise<void> {
  const ids = new Map<string, Types.ObjectId>();
  for (const [name, category] of SKILLS) {
    const doc = await Skill.findOneAndUpdate(
      { name, owner: { $exists: false } },
      { name, category },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    ids.set(name, doc!._id);
  }
  for (const role of ROLES) {
    await Role.findOneAndUpdate(
      { name: role.name },
      {
        name: role.name,
        description: role.description,
        isCustom: false,
        requirements: role.skills.map(([skill, importance]) => ({ skill: ids.get(skill), importance })),
      },
      { upsert: true, new: true }
    );
  }
  await Role.findOneAndUpdate(
    { name: "Custom Role" },
    { name: "Custom Role", description: "Pick your own skills in Profile Settings.", isCustom: true, requirements: [] },
    { upsert: true, new: true }
  );
  console.log("Roles and skills seeded");
}

if (require.main === module) {
  connectDB()
    .then(seedRoles)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}