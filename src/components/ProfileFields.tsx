import type { User } from "@prisma/client";
import { list } from "@/lib/utils";
import { Checkbox, Input, Textarea } from "./ui";

export const INTEREST_OPTIONS = [
  "Project Management", "Leadership", "Public Speaking", "Coaching & Mentoring", "Agile", "Risk Management",
  "Health & Safety", "Fitness & Wellbeing", "Community Service", "Data", "Technology", "Construction", "Sustainability",
];

export function ProfileFields({ user, compact }: { user: User; compact?: boolean }) {
  const interests = new Set(list(user.interests));
  return (
    <div className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-display text-xl font-semibold">About you</legend>
        <Input label="Full name" name="name" defaultValue={user.name} required autoComplete="name" />
        <Input label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" placeholder="+256 …" />
        <Input label="Organisation" name="organization" defaultValue={user.organization ?? ""} autoComplete="organization" />
        <Input label="Job title" name="jobTitle" defaultValue={user.jobTitle ?? ""} autoComplete="organization-title" />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 font-display text-xl font-semibold">PMI membership</legend>
        <p className="text-sm text-muted sm:col-span-2">Partner representatives and invited community participants are welcome too — leave this unchecked if you are not a PMI member.</p>
        <div className="sm:col-span-2"><Checkbox label="I am a PMI member" name="isPmiMember" defaultChecked={user.isPmiMember} /></div>
        <Input label="PMI Member ID" name="pmiMemberId" defaultValue={user.pmiMemberId ?? ""} hint="Used for verification only — never for sign-in." />
        <Input label="Chapter" name="pmiChapter" defaultValue={user.pmiChapter ?? "Uganda"} />
        <Input label="PMI certifications" name="certifications" defaultValue={user.certifications ?? ""} placeholder="PMP, CAPM, PMI-ACP" hint="Comma separated" />
        <Input label="Skills" name="skills" defaultValue={user.skills ?? ""} placeholder="Scheduling, stakeholder management…" />
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-xl font-semibold">Interests</legend>
        <div className="grid gap-1 sm:grid-cols-3">
          {INTEREST_OPTIONS.map((i) => (
            <label key={i} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm hover:bg-brand-50">
              <input type="checkbox" name="interests" value={i} defaultChecked={interests.has(i)} className="h-5 w-5 accent-brand-600" />
              {i}
            </label>
          ))}
        </div>
      </fieldset>

      {!compact && (
        <fieldset className="grid gap-4">
          <legend className="mb-3 font-display text-xl font-semibold">Biography</legend>
          <Textarea label="Short bio" name="bio" defaultValue={user.bio ?? ""} maxLength={1500} />
          <Input label="LinkedIn profile URL" name="linkedin" type="url" defaultValue={user.linkedin ?? ""} placeholder="https://www.linkedin.com/in/…" />
        </fieldset>
      )}
    </div>
  );
}
