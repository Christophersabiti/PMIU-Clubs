# PMI Uganda Clubs — PRD Addendum: Club Requirements Decomposition

**Status:** Draft for review · 1 October 2026
**Extends:** *PMI Uganda Clubs Digital Platform: MVP Product Concept + PRD*
**Sources:** PRD; *PMI Uganda Club Partnership Initiative* (VP Events, 2026 pilot); Fitness Club statement (NTN Fitness)

---

## 0. Product principle

Each club gets **the common PMI Uganda platform plus a small set of club-specific capabilities**. We shouldn't build anything for only one club if two or more clubs could use it.

```
SHARED CORE (every club)
  Clubs · Members · Roles · Partners · Initiatives → Activities → Events · Registration · QR attendance
  Content · Resources · Galleries · Notifications · Analytics · Impact
  + NEW shared engines: Challenges · Programmes/Cohorts · Member Benefits · Forms & Assessments
                        · Hours Log · Event categories & session roles · Data classification
        │
CLUB MODULES (thin layer: configuration + a few unique screens)
  Fitness: My Wellness Journey   Toastmasters: Speech log & evaluations
  Coaching: Coach pool & engagements   Health & Safety: Safety-by-phase toolkit & self-assessment
  Rotary: Community project portfolio & impact assessment
        │
PHASE 2
  Leaderboards · wearables · automated matching · certificates/PDU reporting · partner self-service · WhatsApp · push · payments
```

The decomposition below shows each club's needs. Section 6 then consolidates them.

---

## 1. Fitness Club (partner: NTN Fitness)

### 1.1 Features

These are the features from the Fitness Club statement, each tagged with where it lives architecturally.

| Feature | What the web app should support | MVP | Lives in |
|---|---|---|---|
| Club partner profile | NTN Fitness as official partner: logo, description, expertise, contacts, website/social, partnership info | ✓ | Core: Partners *(built)* |
| Club leadership | Club Captain, partner lead and coordinators with photo, role and profile | ✓ | Core: Club roles *(built; add "Partner Lead" display role)* |
| Personal health profile | Private baseline, goals and progress. Sensitive data optional and owner-only | ✓ | **Fitness module** + Core data classification |
| Personal goals | Daily steps, weekly sessions, hydration, cycling distance | ✓ | Fitness module (Wellness Goals) |
| Baseline → Plan → Track → Review | Structured, PM-style wellness journey | ✓ | **Fitness module** (My Wellness Journey) |
| Fitness challenges | 10,000 steps/day, hydration, vegan, walking, cycling | ✓ | **Core: Challenges engine** |
| Challenge registration | Opt in, see dates, instructions, targets | ✓ | Core: Challenges |
| Progress logging | Steps, water, exercise, cycling, walking | ✓ | Core: Challenges (progress entries) |
| Progress dashboard | Target vs actual, completion %, streaks | ✓ | Core: Challenges + Fitness dashboard |
| Fitness forms | In-app submission replacing external forms | ✓ | Core: Challenges (entry forms) |
| Leaderboards | Rankings with opt-out | Phase 2 | Core: Challenges |
| Physical fitness classes | Venue sessions with registration and attendance | ✓ | Core: Events *(built)* + category `CLASS` |
| Online fitness classes | Zoom/Meet links, instructor, schedule, registration | ✓ | Core: Events *(built: online/hybrid)* + `instructor` |
| Runs, walks & cycling | Dedicated activity types with distance and meeting point | ✓ | Core: Event category `RUN_WALK_CYCLE` + `distanceKm` |
| Nutrition hub | Nutrition, hydration, meal resources, partner content | ✓ | Core: Resources *(built)* + topic tags |
| Health-as-a-Project workshops | PM principles applied to health goals | ✓ | Core: Event category `WORKSHOP` |
| Wellbeing sessions | Stress, burnout, posture, resilience | ✓ | Core: Event category `WELLBEING` |
| Mobile clinic days | Dates, location, services, partner, registration **slots** | ✓ | Core: Event category `CLINIC` + time slots |
| Member benefits | Dedicated benefits area | ✓ | **Core: Member Benefits** |
| Gym discounts | Participating gyms, discount, validity, eligibility, redemption | ✓ | Core: Member Benefits (type `DISCOUNT`) |
| Corporate wellness packages | Packages for members/organisations | ✓ | Core: Member Benefits (type `PACKAGE`) |
| Wellness events | Wellness category in the wider event system | ✓ | Core: Event categories |
| Reminders | Challenges, classes, progress nudges, events | ✓ | Core: Notifications *(events built; extend to challenges)* |
| Fitness analytics | Participation, completion, attendance, trends with **no individual health data** | ✓ | Core: Analytics (aggregates only) |

### 1.2 My Wellness Journey (Fitness module)

```
1 BASELINE → 2 SET GOALS → 3 CREATE PLAN → 4 TRACK → 5 REVIEW → 6 IMPROVE
```

Example: Goal "Walk 8,000 steps/day". Baseline 4,200, target 8,000, current average 6,750 → **84%** of target. Review date 31 Oct 2026.

- **Progress formula:** `(current − baseline) / (target − baseline)`, with simple `current / target` as an option. *Decision needed:* which one to show. The example above uses `current / target`.
- **Review:** on the review date, the member records what went well, what didn't and what's next (a mini retrospective). Then they set a new goal or continue the current one.

### 1.3 Fitness Club dashboard (member view)

My Wellness (today vs target) · Active challenges (%) · Up next (runs, classes) · My progress (weekly chart) · Member benefits (e.g. "NTN Fitness — 20% gym discount") · Latest wellness resources.

### 1.4 Requirements

| ID | Requirement |
|---|---|
| FIT-001 | Member can create a wellness baseline. |
| FIT-002 | Member can define measurable wellness goals. |
| FIT-003 | Admin can create fitness/wellness challenges. |
| FIT-004 | Member can join a challenge. |
| FIT-005 | Member can submit progress. |
| FIT-006 | System calculates target completion percentage. |
| FIT-007 | Member can view progress history. |
| FIT-008 | Admin can create physical/virtual fitness sessions. |
| FIT-009 | Admin can create nutrition/wellness resources. |
| FIT-010 | Partner can publish approved member benefits. |
| FIT-011 | Admin can manage mobile clinic events. |
| FIT-012 | Club Captain can view aggregated engagement analytics. |
| FIT-013 | Private wellness information is access-controlled. |
| FIT-014 | Member can control leaderboard visibility. |
| FIT-015 | System can send challenge/activity reminders. |

---

## 2. PMI × Toastmasters Club

**From the partnership document:** Speechcraft introduction; practical speaking sessions and challenges; presentations, storytelling and impromptu speaking; discounted access and joint events. **Target:** 25+ members engaged in public speaking by Dec 2026.

| Feature | What the web app should support | MVP | Lives in |
|---|---|---|---|
| Speechcraft programme | Enrol in a multi-session Speechcraft cohort and see sessions, attendance and completion | ✓ | **Core: Programmes/Cohorts** |
| Speaking sessions | Regular practice meetings (physical/online) | ✓ | Core: Events + category `SPEAKING_SESSION` |
| Session role sign-up | Members claim meeting roles (Toastmaster of the Day, Speaker 1–3, Evaluator, Table Topics Master, Timer, Grammarian) | ✓ | **Core: Event session roles** (reusable for facilitators, volunteers, run marshals) |
| Speech log / portfolio | Member's record of speeches: title, type (prepared, impromptu, storytelling, project presentation), date, duration | ✓ | **Toastmasters module** |
| Structured evaluations | Evaluator submits feedback (commend / recommend / commend). Visible to the speaker only | ✓ | Toastmasters module (built on Core Forms) |
| Speaking challenges | e.g. "30-Day Public Speaking Challenge", "Impromptu every week" | ✓ | Core: Challenges |
| Speech timer | In-app green/amber/red timer for sessions, usable on a phone | ✓ (small) | Toastmasters module |
| Joint events | Events co-hosted with local Toastmasters clubs | ✓ | Core: Events + Partner *(built)* |
| Member benefit | Discounted Toastmasters membership: eligibility and how to redeem | ✓ | Core: Member Benefits |
| Self-review recordings | Link to an unlisted YouTube/Drive recording on a speech log entry, private by default | ✓ | Toastmasters module |
| Awards / ribbons | Best Speaker / Best Evaluator voting per session | Phase 2 | — |
| Speech video upload | Hosted video | Phase 2 (PRD: keep video external) | — |

| ID | Requirement |
|---|---|
| TM-001 | Admin can run a Speechcraft cohort with sessions and completion criteria. |
| TM-002 | Member can enrol in Speechcraft and see their progress. |
| TM-003 | Admin can define meeting roles for a speaking session; members can claim and release roles. |
| TM-004 | Member can log speeches delivered (type, date, duration, optional recording link). |
| TM-005 | Evaluator can submit a structured evaluation visible only to the speaker (and Club Captain if enabled). |
| TM-006 | Member can view their speaking history and evaluations received. |
| TM-007 | Admin can run speaking challenges (reuses CORE Challenges). |
| TM-008 | Session timer is available to the Timer role during meetings. |
| TM-009 | Club Captain sees aggregated metrics: members engaged (target 25+), speeches delivered, evaluations given, roles filled. |

---

## 3. PMI Coaching Club

**From the partnership document:** build coaching capability so PMs support other PMs. Programme: fundamentals, active listening, powerful questioning, goal setting/feedback/accountability, coaching teams, peer coaching. Model: partner offers a discounted rate; PMI Uganda mobilises and recruits; **Train → Equip → Deploy → Support**. **Target:** 20–25 members trained as coaches.

| Feature | What the web app should support | MVP | Lives in |
|---|---|---|---|
| Cohort application | Apply to the coach-training cohort (motivation, experience, availability); admin selects or waitlists | ✓ | **Core: Programmes/Cohorts** (application + selection) |
| Training tracker (Train) | Modules (fundamentals, listening, questioning, goals/feedback, team coaching) with attendance-based completion | ✓ | Core: Programmes (modules) |
| Partner rate | Coaching partner's special/discounted rate, terms, how to pay (off-platform) | ✓ | Core: Member Benefits |
| Toolkit (Equip) | Templates such as the GROW conversation guide, contracting checklist, feedback models | ✓ | Core: Resources *(built)* |
| Practice hours log | Coach logs practice hours (date, hours, type peer/team, coachee initials only) | ✓ | **Core: Hours Log** (type `COACHING`) |
| Coach pool (Deploy) | Directory of trained coaches with specialties and availability, shown to members | ✓ | **Coaching module** |
| Coaching request | Member asks for a coach; Club Captain matches manually and creates an engagement | ✓ | Coaching module |
| Engagement record | Coach ↔ coachee, start date, session count, status. **Conversation content is never stored** | ✓ | Coaching module |
| Peer supervision (Support) | Supervision and support circles for coaches | ✓ | Core: Events (category `SUPERVISION`) |
| Coachee feedback | Short anonymous survey at engagement close, feeding the "mentorship connections" impact metric | ✓ | Core: Forms |
| Automated mentor matching | Algorithmic matching | Phase 2 (PRD: Later) | — |
| Certificates / PDU claims | Completion certificates and PMI PDU reporting | Phase 2 | — |

| ID | Requirement |
|---|---|
| COA-001 | Member can apply to a coaching cohort; admin can admit, waitlist or decline. |
| COA-002 | Admin can define training modules; completion is derived from attendance. |
| COA-003 | Coach can log practice hours (no coachee personal data beyond initials). |
| COA-004 | Trained coaches can publish a coach profile (specialties, availability, on/off). |
| COA-005 | Member can request coaching; Club Captain can match a coach and create an engagement. |
| COA-006 | Engagement records store metadata only (dates, session count, status), never session notes. |
| COA-007 | Coachee can give anonymous feedback when an engagement closes. |
| COA-008 | Club Captain sees aggregated metrics: applicants, enrolled, trained (target 20–25), practice hours, active engagements. |

---

## 4. PMI Health & Safety Club (partner: HSAU)

**From the partnership document:** knowledge-sharing sessions with HSAU; practical safety guidance for PMs; joint events and awareness activities; access to HSAU programmes. Safety built into every phase: *planning & risk management · execution & stakeholder management · governance & closeout*. **Target:** 1 joint knowledge session + 1 joint activity.

| Feature | What the web app should support | MVP | Lives in |
|---|---|---|---|
| Safety-by-phase knowledge base | Resources organised by project phase (Planning & Risk / Execution & Stakeholders / Governance & Closeout) | ✓ | **H&S module**: a view over Core Resources with a `phase` tag |
| Safety toolkits | Downloadable templates: HSE risk register, toolbox-talk template, site inspection checklist, incident-report template | ✓ | Core: Resources *(built)* |
| Knowledge sessions | Joint HSAU sessions (physical/hybrid) | ✓ | Core: Events + category `KNOWLEDGE_SESSION` |
| HSAU programme catalogue | Relevant HSAU courses and certifications with member rates | ✓ | Core: Member Benefits (type `PROGRAMME`) |
| Project safety self-assessment | Short questionnaire scoring safety practice across the three phases, with a private result and suggested resources | ✓ | **H&S module** (on Core Forms) |
| Awareness campaigns | e.g. "30-Day Workplace Safety Challenge" | ✓ | Core: Challenges |
| Community awareness activity | Joint volunteer activity with HSAU | ✓ | Core: Events (volunteer) *(built)* |
| Ask-the-expert | Members submit questions answered at the next session | ✓ (form) | Core: Forms |
| Incident reporting | Reporting real workplace incidents | **Not in scope.** This is a legal and organisational duty outside the platform | — |

| ID | Requirement |
|---|---|
| HS-001 | Resources can be tagged by project phase; the club page shows a phase-based knowledge base. |
| HS-002 | Admin can publish safety templates and toolkits. |
| HS-003 | Admin can list partner programmes (HSAU) with member rates and eligibility. |
| HS-004 | Member can complete a project-safety self-assessment and see a private score with recommended resources. |
| HS-005 | Admin can run safety awareness challenges (reuses CORE Challenges). |
| HS-006 | Members can submit questions for upcoming knowledge sessions. |
| HS-007 | Club Captain sees sessions held, attendees, toolkit downloads and assessments completed (aggregated). |

---

## 5. PMI × Rotary Club — PMI Volunteers in Action

**From the partnership document:** members apply PM expertise to community projects: *project design* (objectives, stakeholders, plans, risks), *project coaching* during implementation, *impact & value assessment*, *storytelling* (problem, people, results, lessons). Assessment questions: *What was delivered? What value was created? Who benefited? What can be improved?* **Target:** 1–2 community projects supported and documented.

| Feature | What the web app should support | MVP | Lives in |
|---|---|---|---|
| Community project portfolio | Project record: name, Rotary club, community/location, problem, status, beneficiaries | ✓ | **Rotary module** |
| Project intake | Rotary clubs (via the Club Captain) submit projects needing PM support; admin reviews and accepts | ✓ | Rotary module (on Core Forms) |
| Project design canvas | Structured objectives, stakeholders, plan/milestones and risks, completed by the volunteer team | ✓ | Rotary module |
| Volunteer roles & sign-up | Roles per project (project designer, risk lead, M&E lead, storyteller, coach); members apply and the captain confirms | ✓ | Core: Session/Project roles |
| Volunteer hours | Members log hours per project; the captain approves; hours feed impact | ✓ | Core: Hours Log (type `VOLUNTEER`) |
| Impact assessment | The four questions plus beneficiary count | ✓ | Rotary module, feeding Core Impact metrics |
| Impact story | Publish Problem · People · Results · Lessons as an Impact Story | ✓ | Core: Posts *(built: IMPACT_STORY)* |
| Public showcase | Project page with photos, story and results for the December showcase | ✓ | Rotary module + Core Galleries *(built)* |

| ID | Requirement |
|---|---|
| ROT-001 | Admin can create community projects linked to a Rotary partner and community. |
| ROT-002 | Project requests can be submitted and accepted or declined by the Club Captain. |
| ROT-003 | Volunteer team can complete a project design canvas (objectives, stakeholders, plan, risks). |
| ROT-004 | Admin can define project roles; members apply; captain confirms. |
| ROT-005 | Members log volunteer hours per project; captain approves. |
| ROT-006 | Team completes an impact assessment (delivered, value, beneficiaries, improvements). |
| ROT-007 | Approved assessment can be published as an impact story and project showcase. |
| ROT-008 | Club Captain sees projects supported (target 1–2), volunteers, approved hours and beneficiaries. |

---

## 6. Consolidation

### 6.1 Shared Core: new engines every club uses

| Engine | Used by | Replaces club-specific builds for |
|---|---|---|
| **CORE-CH · Challenges** (Club → Challenge → Participants → Targets → Progress entries → Results) | Fitness, Toastmasters, H&S, Coaching (career), Rotary (service) | Step, hydration, speaking, safety and service challenges |
| **CORE-PG · Programmes / Cohorts** (application, selection, modules, completion) | Toastmasters (Speechcraft), Coaching (coach cohort), Fitness (multi-week classes) | Speechcraft tracker, coach-training tracker |
| **CORE-BN · Member Benefits** (partner, type DISCOUNT/PACKAGE/PROGRAMME, eligibility, validity, redemption; codes members-only) | All five | Gym discounts, wellness packages, Toastmasters discount, coaching rate, HSAU programmes |
| **CORE-FM · Forms & Assessments** (versioned schema, privacy level per form, scoring) | Fitness baseline, H&S self-assessment, Coaching application and feedback, Rotary intake and impact assessment, TM evaluations | Every Google Form |
| **CORE-HR · Hours Log** (type, hours, date, link to project/programme, approval) | Rotary (volunteer), Coaching (practice), all (volunteer days) | Volunteer and coaching hours |
| **CORE-EV · Event categories & roles** (category, instructor, distance, time slots, claimable roles) | Fitness classes/runs/clinics, TM meetings, H&S sessions, Rotary project days | Club-specific event types |
| **CORE-PV · Data classification** (Public · Members · Club admins · Owner-only) | Wellness data, evaluations, assessments, coaching | Ad-hoc privacy logic |
| **CORE-RM · Reminders** (events *(built)*, challenge nudges, review dates, module sessions) | All | — |

### 6.2 Club-Specific Modules (thin)

| Club | Unique module | Unique screens |
|---|---|---|
| Fitness | My Wellness Journey | Baseline, goals and plan, Fitness dashboard, review/retrospective |
| Toastmasters | Speaking portfolio | Speech log, evaluations received, session role sheet, timer |
| Coaching | Coach pool & engagements | Coach profiles, request a coach, engagement tracker |
| Health & Safety | Safety-by-phase | Phase knowledge base, safety self-assessment result |
| Rotary | Community projects | Project portfolio, design canvas, impact assessment, showcase |

### 6.3 Phase 2

Leaderboards (with opt-out) · wearable/Strava integrations · automated mentor matching · certificates and **PDU tracking/claims** · speech video hosting · awards and voting · partner self-service portal (**partner logins on hold per 1 Oct decision**) · WhatsApp API · PWA push notifications · payments for paid classes/programmes.

---

## 7. Roles and permissions update

```
Platform Administrator (one, for now)
   └── Club Captain / Lead            create activities, approve & publish content, manage challenges,
   │                                  registrations, benefits, analytics; coordinate the partner
   ├── Content Manager / Event Coordinator  (existing)
   ├── Facilitator / Coach / Instructor     NEW: run assigned sessions, take attendance,
   │                                        see participants of their sessions only
   └── Partner Lead (e.g. NTN Fitness)      partner-supported activities, resources, benefits, approval needed
                                            → ON HOLD (internal admins only for now; display-only on club page)
Members
```

No role (Club Captain included) can see an individual's **owner-only** wellness, assessment or evaluation data. Analytics are aggregated.

---

## 8. Privacy requirements

Health data is **special personal data** under Uganda's *Data Protection and Privacy Act, 2019*. It needs explicit consent, a stated purpose, minimisation and the right to delete. Please confirm with the chapter's data-protection lead.

| Rule | Requirement |
|---|---|
| PRIV-001 | Member profile (name, PMI details, clubs, skills, interests) is **separate** from the private wellness profile (baseline, goals, progress, assessments). |
| PRIV-002 | Wellness, assessment, evaluation and coaching data are **owner-only by default** and never appear in the directory or on public profiles. |
| PRIV-003 | Explicit opt-in consent before first wellness entry, recorded with a timestamp and policy version. |
| PRIV-004 | Data minimisation: MVP collects steps, water, activity minutes, distance and free-text goals. **No diagnoses, conditions, medications or clinical results.** Weight/BMI optional, owner-only (*decision needed*). |
| PRIV-005 | Club analytics use aggregates only, with a minimum group size (e.g. ≥ 5) before showing a breakdown. |
| PRIV-006 | Members can export and delete their wellness data at any time. |
| PRIV-007 | Mobile clinic days record **registration slots only**. Clinical services and results stay with the clinic partner. |
| PRIV-008 | Coaching engagements store metadata only, never conversation content. |

---

## 9. Database architecture additions (sketch)

```
Challenge(id, clubId, title, metric, unit, cadence[DAILY|WEEKLY|TOTAL], targetValue, startsAt, endsAt,
          instructions, leaderboardEnabled, status)
ChallengeParticipant(id, challengeId, userId, personalTarget?, showOnLeaderboard, joinedAt)
ProgressEntry(id, participantId, date, value, note, source[MANUAL])

WellnessProfile(userId PK, consentAt, consentVersion, baseline JSON)            -- owner-only
WellnessGoal(id, userId, metric, unit, baseline, target, cadence, plan, startDate, reviewDate, status)
GoalEntry(id, goalId, date, value)
GoalReview(id, goalId, wentWell, toImprove, nextStep, createdAt)

Programme(id, clubId, kind[COHORT|COURSE], title, requiresApplication, capacity, startsAt, endsAt)
ProgrammeModule(id, programmeId, title, order, eventId?)
Enrolment(id, programmeId, userId, status[APPLIED|ADMITTED|WAITLISTED|DECLINED|COMPLETED], applicationResponseId?)

Benefit(id, partnerId, clubId?, type[DISCOUNT|PACKAGE|PROGRAMME], title, details, eligibility,
        redemption, code?, validFrom, validTo, status[DRAFT|PUBLISHED])

Form(id, clubId?, purpose, schema JSON, privacy[OWNER|CLUB_ADMIN|PUBLIC], scoring JSON?, version)
FormResponse(id, formId, userId?, subjectId?, data JSON, score?, createdAt)

HoursLog(id, userId, clubId, type[VOLUNTEER|COACHING|PRACTICE], hours, date, projectId?, status[PENDING|APPROVED|REJECTED], approvedById?)

Event  += category, instructor, distanceKm, slots(EventSlot: id, eventId, startsAt, capacity)
EventRole(id, eventId, name, userId?, claimedAt)

SpeechLog(id, userId, eventId?, title, type, deliveredAt, durationSec, recordingUrl?)          -- TM
Evaluation(id, speechLogId, evaluatorId, responseId)                                           -- TM, speaker-only

CoachProfile(userId PK, specialties, availability, active)                                      -- Coaching
CoachingEngagement(id, coachId, coacheeId, status, startedAt, sessionsCount, closedAt)        -- metadata only

CommunityProject(id, clubId, partnerId, rotaryClub, community, problem, status, beneficiaries) -- Rotary
ProjectDesign(projectId PK, objectives, stakeholders, plan, risks)
ProjectRole(id, projectId, name, userId?, status)
ImpactAssessment(projectId PK, delivered, valueCreated, beneficiaries, improvements, approvedAt)

Resource += phase[PLANNING|EXECUTION|CLOSEOUT]?, topic[NUTRITION|WELLBEING|…]?
ConsentRecord(id, userId, scope, version, grantedAt, revokedAt?)
```

---

## 10. Already delivered in the current build

Partner profiles · club leadership display · physical/online/hybrid events with registration, waitlist and **QR attendance** · resources (with partner resources) · galleries · announcements · email and in-app reminders for events · volunteer flag and impact hours · aggregated club analytics and target progress · impact stories · per-club RBAC · approval-required joins.

## 11. Decisions needed

1. **Progress %:** `current ÷ target` (as in the example) or `(current − baseline) ÷ (target − baseline)`?
2. **Weight/BMI:** collect at all in MVP (owner-only), or steps/water/activity only?
3. **Partner Lead (NTN Fitness):** the Fitness statement needs a partner lead role, but partner logins are on hold. Show them display-only for now?
4. **Facilitator/Coach/Instructor role:** add now, for class instructors and session take-attendance?
5. **PDU tracking:** PMI members value PDUs. Tag activities as PDU-eligible in the MVP and leave the claims export to Phase 2?
6. **Build order:** suggested CORE-CH Challenges → Fitness Wellness Journey → CORE-BN Benefits → CORE-PG Programmes (Speechcraft + coach cohort) → Rotary projects → H&S self-assessment.
