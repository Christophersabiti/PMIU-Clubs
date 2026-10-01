/* Seed data drawn from "PMI Uganda Club Partnership Initiative" (VP Events portfolio · 2026 pilot).
 *
 * Environment:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_NAME / SEED_ADMIN_PASSWORD  – the single platform administrator
 *   SEED_DEMO=false  – production seed: clubs, partners, programme and content only (no demo people)
 *   SEED_MODE=bootstrap – used by `vercel-build`: seeds ONLY an empty database (no wipe, no demo people);
 *                         skips quietly when data exists or the admin env vars are missing
 * Demo accounts all use DEMO_PASSWORD — never run the demo seed against production. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();
const DEMO_PASSWORD = "ClubsDemo2026!";
const BOOTSTRAP = process.env.SEED_MODE === "bootstrap";
const WITH_DEMO = !BOOTSTRAP && process.env.SEED_DEMO !== "false";
const at = (iso: string) => new Date(`${iso}+03:00`); // Kampala time
const ticket = () => randomBytes(9).toString("base64url");

async function main() {
  if (BOOTSTRAP) {
    if ((await db.club.count()) > 0) return console.log("Bootstrap: database already has data — skipping.");
    if (!process.env.SEED_ADMIN_EMAIL || (process.env.SEED_ADMIN_PASSWORD ?? "").length < 12)
      return console.warn("Bootstrap: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (12+ chars) not set — skipping initial seed.");
    console.log("Bootstrap: empty database — loading clubs, partners, programme and platform administrator.");
  }
  // wipe (order matters for FKs) — never in bootstrap mode
  if (!BOOTSTRAP) for (const t of [
    "auditLog", "emailLog", "notification", "galleryImage", "gallery", "media", "resource", "post", "impactMetric",
    "eventAttendance", "eventRegistration", "event", "activity", "initiative", "clubPartner", "partner", "clubRole",
    "clubMembership", "club", "user", "setting",
  ] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)[t].deleteMany();
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const mkUser = (email: string, name: string, extra: Record<string, unknown> = {}) =>
    db.user.create({ data: { email, name, passwordHash: hash, profileCompleted: true, isPmiMember: true, pmiChapter: "Uganda", ...extra } });

  // One platform administrator; club-level admins are assigned per club (Admin › Clubs › Leadership & roles).
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase() ?? "admin@pmiuganda.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? (WITH_DEMO ? DEMO_PASSWORD : "");
  if (!WITH_DEMO && adminPassword.length < 12) throw new Error("Set SEED_ADMIN_PASSWORD (12+ characters) for a production seed.");
  const superAdmin = await db.user.create({
    data: {
      email: adminEmail,
      name: process.env.SEED_ADMIN_NAME ?? "Platform Administrator",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      globalRole: "SUPER_ADMIN",
      jobTitle: "Platform Administrator",
      organization: "PMI Uganda Chapter",
      profileCompleted: true,
      isPmiMember: true,
      pmiChapter: "Uganda",
    },
  });
  const chapterAdmin = superAdmin; // content authorship

  const member = WITH_DEMO ? await mkUser("member@pmiuganda.test", "Christopher Sabiti", {
    jobTitle: "Product Manager",
    certifications: "PMP",
    pmiMemberId: "DEMO-000123",
    interests: "Project Management, Leadership, Data, Technology",
    skills: "Product management, Agile delivery, Data analytics",
    bio: "Product manager passionate about building digital platforms that create measurable community impact.",
    linkedin: "https://www.linkedin.com/",
  }) : null;

  // ─── Clubs ───────────────────────────────────────────────────────────
  const clubsData = [
    {
      slug: "toastmasters",
      name: "PMI Uganda × Toastmasters Club",
      shortName: "Toastmasters",
      tagline: "Communication & Leadership",
      focus: "Communication • Leadership • Public Speaking",
      summary: "Improve public speaking, communication and leadership.",
      description: "Stronger communication, public-speaking and leadership skills for members, through Toastmasters.",
      vision: "Confident, articulate project leaders who communicate with clarity and influence.",
      gains: "Confident, articulate project leadership\nA safe space to practise speaking\nA new member benefit for PMI Uganda\nCloser ties with Toastmasters",
      programme: "Introduce members to the Speechcraft programme\nPractical speaking sessions and challenges\nPractise presentations, storytelling and impromptu speaking\nExplore discounted access and joint events",
      accent: "#a855f7",
      icon: "mic",
      coverImage: "/images/clubs/toastmasters.jpg",
      targetValue: "25+",
      targetLabel: "members engaged in public-speaking activities",
      targetNumber: 25,
      targetMetric: "MEMBERS",
    },
    {
      slug: "fitness",
      name: "PMI Uganda Fitness Club",
      shortName: "Fitness",
      tagline: "Move. Connect. Thrive.",
      focus: "Movement • Wellness • Community",
      summary: "Promote active living, wellbeing and networking through physical activities.",
      description: "Healthy lifestyles, networking and wellbeing for members, through fitness partnerships and activities.",
      vision: "An active, visible PMI community where wellbeing and networking go hand in hand.",
      gains: "Health and wellbeing\nNetworking beyond the office\nAn active, visible PMI community\nCorporate and fitness partnerships",
      programme: "Walking, running and cycling challenges\nCommunity runs and walks\nStep-count and fitness challenges\nPartner and PMI-branded fitness events",
      accent: "#f59e0b",
      icon: "activity",
      coverImage: "/images/clubs/fitness.jpg",
      targetValue: "2–3",
      targetLabel: "fitness and community activities",
      targetNumber: 3,
      targetMetric: "ACTIVITIES",
    },
    {
      slug: "coaching",
      name: "PMI Uganda Coaching & Mentorship Club",
      shortName: "Coaching",
      tagline: "Learn. Mentor. Grow.",
      focus: "Coaching • Leadership • PM Development",
      summary: "Connect professionals with coaches, mentors and peer-development opportunities.",
      description: "Building coaching capability so project managers can support other project professionals.",
      vision: "A sustainable peer-coaching ecosystem: Train → Equip → Deploy → Support.",
      gains: "Coaching fundamentals and conversations\nActive listening and powerful questioning\nGoal setting, feedback and accountability\nCoaching project teams; peer coaching",
      programme: "Partner offers a special or discounted training rate\nPMI Uganda mobilises, promotes and recruits\nTrain · Equip · Deploy · Support\nA sustainable peer-coaching ecosystem",
      accent: "#10b981",
      icon: "compass",
      coverImage: "/images/clubs/coaching.jpg",
      targetValue: "20–25",
      targetLabel: "members trained as coaches",
      targetNumber: 25,
      targetMetric: "COACHES",
    },
    {
      slug: "health-safety",
      name: "PMI Uganda Health & Safety Club",
      shortName: "Health & Safety",
      tagline: "Wellbeing. Safety. Resilience.",
      focus: "Safety & Risk Awareness",
      summary: "Promote professional and personal health, safety and wellbeing.",
      description: "Practical health and safety knowledge for project professionals, plus joint community initiatives with HSAU.",
      vision: "Safe projects are successful projects — safety built into every phase.",
      gains: "Practical safety guidance for project managers\nSafety in planning and risk management\nSafety in execution and stakeholder management\nSafety in governance and closeout",
      programme: "Knowledge-sharing sessions with HSAU\nPractical safety guidance for PMs\nJoint events and awareness activities\nAccess to relevant HSAU programmes",
      accent: "#ef4444",
      icon: "shield",
      coverImage: "/images/clubs/health-safety.jpg",
      targetValue: "1 + 1",
      targetLabel: "joint knowledge session and joint activity",
      targetNumber: 2,
      targetMetric: "SESSIONS",
    },
    {
      slug: "rotary",
      name: "PMI Uganda × Rotary Club",
      shortName: "Rotary",
      tagline: "Service. Community. Impact.",
      focus: "Project Design & Storytelling",
      summary: "Connect project professionals with service and community-impact opportunities.",
      description:
        "PMI Volunteers in Action: members apply project-management expertise to help community projects deliver greater value.",
      vision: "Apply project-management expertise to community projects so they deliver greater, documented value.",
      gains: "Project design: objectives, stakeholders, plans, risks\nProject coaching as teams implement\nImpact and value assessment\nStorytelling: problem, people, results, lessons",
      programme: "What was delivered?\nWhat value was created?\nWho benefited?\nWhat can be improved?",
      accent: "#3b82f6",
      icon: "globe",
      coverImage: "/images/clubs/rotary.jpg",
      targetValue: "1–2",
      targetLabel: "community projects supported and documented",
      targetNumber: 2,
      targetMetric: "PROJECTS",
    },
  ];
  const clubs: Record<string, { id: string }> = {};
  for (const [i, c] of clubsData.entries()) {
    clubs[c.slug] = await db.club.create({ data: { ...c, requiresApproval: true, sortOrder: i, targetDeadline: at("2026-12-31T23:59") } });
  }

  // ─── Partners ────────────────────────────────────────────────────────
  const partnerData = [
    {
      slug: "toastmasters-international",
      name: "Toastmasters International",
      description: "Global organisation helping people develop communication and leadership skills through a worldwide network of clubs.",
      expertise: "Public speaking\nCommunication\nLeadership\nPresentation skills",
      website: "https://www.toastmasters.org",
      status: "ACTIVE",
      club: "toastmasters",
      provides: "Speechcraft programme, experienced evaluators and joint events",
      memberBenefit: "Speaking & leadership skills; explore discounted access",
    },
    {
      slug: "fitness-partners",
      name: "Fitness Partners (to be confirmed)",
      description: "Gyms, running clubs and wellness organisations partnering with PMI Uganda for community fitness activities.",
      expertise: "Group fitness\nRunning & cycling\nWellness",
      status: "PROSPECT",
      club: "fitness",
      provides: "Venues, trainers and branded fitness events",
      memberBenefit: "Health, networking & fun",
    },
    {
      slug: "coaching-partner",
      name: "Coaching Partner (to be confirmed)",
      description: "Professional coaching organisation offering a special or discounted rate to train PMI Uganda members as coaches.",
      expertise: "Coaching fundamentals\nActive listening\nPowerful questioning\nTeam coaching",
      status: "PROSPECT",
      club: "coaching",
      provides: "Coach training at a special or discounted rate",
      memberBenefit: "Coaching capability",
    },
    {
      slug: "hsau",
      name: "HSAU",
      description: "Strategic health and safety partner bringing practical safety knowledge and joint community initiatives to project professionals.",
      expertise: "Occupational health & safety\nRisk awareness\nSafety training",
      status: "ACTIVE",
      club: "health-safety",
      provides: "Knowledge-sharing sessions and access to relevant HSAU programmes",
      memberBenefit: "Practical safety knowledge",
    },
    {
      slug: "rotary",
      name: "Rotary",
      description: "Service organisation whose community projects benefit from PMI volunteers' project design, coaching and impact-assessment expertise.",
      expertise: "Community service\nHumanitarian projects\nVolunteer mobilisation",
      website: "https://www.rotary.org",
      status: "ACTIVE",
      club: "rotary",
      provides: "Real community projects for PMI volunteers to support",
      memberBenefit: "Applying PM skills to real projects",
    },
  ];
  const partners: Record<string, { id: string }> = {};
  for (const p of partnerData) {
    const { club, provides, memberBenefit, ...rest } = p;
    partners[p.slug] = await db.partner.create({ data: { ...rest, activeSince: at("2026-10-01T00:00") } });
    await db.clubPartner.create({
      data: { clubId: clubs[club].id, partnerId: partners[p.slug].id, relationship: "Strategic partner", provides, memberBenefit },
    });
  }

  // ─── Club → Initiative → Activity → Event ────────────────────────────
  const initiative = (club: string, title: string, description: string) =>
    db.initiative.create({ data: { clubId: clubs[club].id, title, description, startDate: at("2026-10-01T00:00"), endDate: at("2026-12-31T23:59") } });
  const activity = (club: string, initiativeId: string, data: Record<string, unknown>) =>
    db.activity.create({ data: { clubId: clubs[club].id, initiativeId, status: "PLANNED", ...data } as never });

  const tmI = await initiative("toastmasters", "Confident Communicators 2026", "Introduce PMI Uganda members to structured public-speaking practice through Toastmasters.");
  const tmSpeechcraft = await activity("toastmasters", tmI.id, { title: "Speechcraft Programme", type: "TRAINING", summary: "Structured introduction to public speaking with Toastmasters evaluators.", partnerId: partners["toastmasters-international"].id, startDate: at("2026-11-01T00:00") });
  const tmChallenge = await activity("toastmasters", tmI.id, { title: "Monthly Speaking Challenge", type: "CHALLENGE", summary: "Practise presentations, storytelling and impromptu speaking every month.", status: "ACTIVE", startDate: at("2026-10-01T00:00") });

  const fitI = await initiative("fitness", "PMI Uganda Wellness Initiative 2026", "Healthy lifestyles, networking and wellbeing for members.");
  const fitRuns = await activity("fitness", fitI.id, { title: "Community Runs & Walks", type: "SOCIAL", summary: "Regular community runs and walks around Kampala.", status: "ACTIVE", startDate: at("2026-09-27T00:00") });
  await activity("fitness", fitI.id, { title: "November Step-Count Challenge", type: "CHALLENGE", summary: "Track your steps for 30 days and climb the club leaderboard.", startDate: at("2026-11-01T00:00"), endDate: at("2026-11-30T23:59") });

  const coI = await initiative("coaching", "Peer Coaching Ecosystem — Cohort 1", "Train · Equip · Deploy · Support: building 20–25 PMI Uganda coaches.");
  const coRecruit = await activity("coaching", coI.id, { title: "Coach Recruitment Drive", type: "SESSION", summary: "Recruit 20–25 members into the first coaching cohort.", status: "ACTIVE", startDate: at("2026-10-01T00:00") });
  const coTrain = await activity("coaching", coI.id, { title: "Coaching Fundamentals Training", type: "TRAINING", summary: "Coaching conversations, active listening, powerful questioning, goal setting and accountability.", partnerId: partners["coaching-partner"].id, startDate: at("2026-11-12T00:00") });

  const hsI = await initiative("health-safety", "Safety in Every Project Phase", "Practical safety guidance across planning, execution, governance and closeout.");
  const hsSession = await activity("health-safety", hsI.id, { title: "Joint HSAU Knowledge Session", type: "SESSION", summary: "Knowledge sharing with HSAU on safety across the project life cycle.", partnerId: partners.hsau.id, startDate: at("2026-11-19T00:00") });
  const hsAwareness = await activity("health-safety", hsI.id, { title: "Joint Safety Awareness Activity", type: "VOLUNTEER", isVolunteer: true, summary: "A joint community awareness activity with HSAU.", partnerId: partners.hsau.id, startDate: at("2026-12-05T00:00") });

  const roI = await initiative("rotary", "PMI Volunteers in Action", "Members apply project-management expertise to Rotary community projects.");
  const roDesign = await activity("rotary", roI.id, { title: "Community Project Design Support", type: "PROJECT", isVolunteer: true, summary: "Project design: objectives, stakeholders, plans and risks for a Rotary community project.", partnerId: partners.rotary.id, startDate: at("2026-11-21T00:00") });
  const roStory = await activity("rotary", roI.id, { title: "Impact Assessment & Storytelling", type: "PROJECT", isVolunteer: true, summary: "Document what was delivered, the value created, who benefited and lessons learned.", startDate: at("2026-12-01T00:00") });

  const ev = (club: string, data: Record<string, unknown>) => db.event.create({ data: { clubId: clubs[club].id, status: "PUBLISHED", ...data } as never });

  const run = await ev("fitness", {
    title: "Saturday Fitness Run", initiativeId: fitI.id, activityId: fitRuns.id,
    summary: "5 km / 10 km community run — the first official PMI Uganda Fitness Club activity.",
    description: "Join the PMI Uganda Fitness Club for our first official Saturday run. Choose 5 km or 10 km. Bring water, wear your PMI Uganda colours and invite a colleague.",
    startsAt: at("2026-10-03T07:00"), endsAt: at("2026-10-03T09:00"), locationName: "Kololo Independence Grounds, Kampala",
    mapUrl: "https://maps.google.com/?q=Kololo+Independence+Grounds", mode: "PHYSICAL", capacity: 80, registrationDeadline: at("2026-10-02T18:00"),
    facilitator: "Fitness Club Captain", bannerUrl: "/images/clubs/fitness.jpg",
  });
  await ev("fitness", {
    title: "Kampala Community Walk & Cycle", initiativeId: fitI.id, activityId: fitRuns.id, partnerId: partners["fitness-partners"].id,
    summary: "Walk, run or cycle — November's partner fitness event.",
    startsAt: at("2026-11-14T06:30"), endsAt: at("2026-11-14T10:00"), locationName: "Lugogo, Kampala", mode: "PHYSICAL", capacity: 100,
    bannerUrl: "/images/clubs/fitness.jpg",
  });
  await ev("toastmasters", {
    title: "Impromptu Speaking Challenge (Online)", initiativeId: tmI.id, activityId: tmChallenge.id,
    summary: "Two-minute Table Topics® style impromptu speeches with friendly evaluation.",
    startsAt: at("2026-10-22T18:00"), endsAt: at("2026-10-22T19:30"), mode: "ONLINE", onlineUrl: "https://meet.google.com/", capacity: 40,
    facilitator: "Toastmasters evaluators", bannerUrl: "/images/clubs/toastmasters.jpg",
  });
  await ev("toastmasters", {
    title: "Speechcraft Introduction Session", initiativeId: tmI.id, activityId: tmSpeechcraft.id, partnerId: partners["toastmasters-international"].id,
    summary: "Your first step into the Speechcraft programme with Toastmasters.",
    description: "An interactive session introducing the Speechcraft programme: structured speeches, evaluation and leadership practice.",
    startsAt: at("2026-11-07T10:00"), endsAt: at("2026-11-07T13:00"), locationName: "Kampala (venue to be confirmed)", mode: "HYBRID",
    onlineUrl: "https://meet.google.com/", capacity: 30, registrationDeadline: at("2026-11-05T17:00"), bannerUrl: "/images/clubs/toastmasters.jpg",
  });
  await ev("coaching", {
    title: "Coaching Programme Information Session", initiativeId: coI.id, activityId: coRecruit.id,
    summary: "Learn how the 20–25 member coaching cohort will work and how to apply.",
    startsAt: at("2026-10-15T18:00"), endsAt: at("2026-10-15T19:00"), mode: "ONLINE", onlineUrl: "https://meet.google.com/", capacity: 100,
    bannerUrl: "/images/clubs/coaching.jpg",
  });
  await ev("coaching", {
    title: "Coaching Fundamentals — Cohort 1, Session 1", initiativeId: coI.id, activityId: coTrain.id, partnerId: partners["coaching-partner"].id,
    summary: "Coaching conversations, active listening and powerful questioning.",
    startsAt: at("2026-11-12T17:30"), endsAt: at("2026-11-12T20:00"), locationName: "Kampala (venue to be confirmed)", mode: "PHYSICAL", capacity: 25,
    registrationDeadline: at("2026-11-08T17:00"), bannerUrl: "/images/clubs/coaching.jpg",
  });
  await ev("health-safety", {
    title: "Safety in Every Project Phase — Joint HSAU Session", initiativeId: hsI.id, activityId: hsSession.id, partnerId: partners.hsau.id,
    summary: "Planning & risk, execution & stakeholders, governance & closeout — practical safety for PMs.",
    startsAt: at("2026-11-19T17:30"), endsAt: at("2026-11-19T19:30"), mode: "HYBRID", locationName: "Kampala (venue to be confirmed)",
    onlineUrl: "https://meet.google.com/", capacity: 80, bannerUrl: "/images/clubs/health-safety.jpg",
  });
  await ev("health-safety", {
    title: "Community Safety Awareness Day", initiativeId: hsI.id, activityId: hsAwareness.id, partnerId: partners.hsau.id, isVolunteer: true,
    summary: "Joint HSAU awareness activity in the community.", startsAt: at("2026-12-05T09:00"), endsAt: at("2026-12-05T13:00"),
    locationName: "Kampala", mode: "PHYSICAL", capacity: 40, bannerUrl: "/images/clubs/health-safety.jpg",
  });
  await ev("rotary", {
    title: "Community Project Selection & Design Workshop", initiativeId: roI.id, activityId: roDesign.id, partnerId: partners.rotary.id, isVolunteer: true,
    summary: "Pick the first Rotary community project and frame objectives, stakeholders, plans and risks.",
    startsAt: at("2026-11-21T09:00"), endsAt: at("2026-11-21T13:00"), locationName: "Kampala (venue to be confirmed)", mode: "PHYSICAL", capacity: 30,
    bannerUrl: "/images/clubs/rotary.jpg",
  });
  await ev("rotary", {
    title: "Impact Storytelling Lab", initiativeId: roI.id, activityId: roStory.id, isVolunteer: true,
    summary: "Capture the problem, people, results and lessons from the community project.",
    startsAt: at("2026-12-10T17:30"), endsAt: at("2026-12-10T19:30"), mode: "ONLINE", onlineUrl: "https://meet.google.com/", capacity: 50,
    bannerUrl: "/images/clubs/rotary.jpg",
  });

  // ─── Content ─────────────────────────────────────────────────────────
  await db.post.createMany({
    data: [
      {
        type: "ANNOUNCEMENT", slug: "five-clubs-one-launch", title: "Five Clubs. One Launch.",
        excerpt: "PMI membership is about to become more than certificates. This October we launch five strategic clubs with partners who bring the skills.",
        body: "PMI membership is about to become more than certificates.\n\nStarting 1st October 2026, PMI Uganda launches five strategic clubs — Toastmasters, Fitness, Coaching, Health & Safety and Rotary — each delivered with a partner organisation that brings complementary expertise.\n\nEvery club has a Club Captain, a WhatsApp community, a partner organisation, an activity calendar and participation targets.\n\nExplore the clubs, join as many as you like with one account, and register for the first activities.",
        coverImage: "/images/clubs/community.jpg", publishedAt: at("2026-10-01T08:00"), authorId: chapterAdmin.id,
      },
      {
        type: "NEWS", slug: "90-day-roadmap", title: "The 90-day roadmap: Build, Activate, Showcase",
        excerpt: "October builds people, partners and platforms. November delivers one real activity per club. December showcases impact.",
        body: "October — Build: confirm the five Club Captains, create the WhatsApp groups, confirm partners and objectives, and launch the clubs to members.\n\nNovember — Activate: Toastmasters Speechcraft session; a Fitness walk, run or cycle; Coaching recruits 20–25 members; a joint HSAU safety session; Rotary picks its first project.\n\nDecember — Showcase: collect data and feedback, document success stories, showcase at year-end events and build the 2027 calendar.\n\n2026 is the pilot. 2027 is the scale.",
        publishedAt: at("2026-10-01T09:00"), authorId: chapterAdmin.id,
      },
      {
        type: "NEWS", clubId: clubs.coaching.id, slug: "coaching-cohort-recruitment-open", title: "Coaching cohort recruitment is open",
        excerpt: "We are recruiting 20–25 members to train as coaches in partnership with our coaching partner.",
        body: "The PMI Uganda Coaching Club is recruiting its first cohort of 20–25 members. Training covers coaching conversations, active listening, powerful questioning, goal setting, feedback and accountability, and coaching project teams.\n\nJoin the club and register for the information session on 15 October.",
        coverImage: "/images/clubs/coaching.jpg", publishedAt: at("2026-10-01T10:00"), authorId: chapterAdmin.id,
      },
      {
        type: "ANNOUNCEMENT", clubId: clubs.fitness.id, slug: "first-saturday-run", title: "First Saturday Fitness Run — 3 October",
        excerpt: "Register now for our first official run at Kololo. 5 km and 10 km options.",
        body: "Our first official Fitness Club run is on Saturday 3 October at 7:00 AM at Kololo Independence Grounds. Register on the platform to get your QR ticket for check-in.",
        coverImage: "/images/clubs/fitness.jpg", publishedAt: at("2026-09-28T12:00"), authorId: chapterAdmin.id,
      },
    ],
  });

  await db.resource.createMany({
    data: [
      { clubId: clubs.toastmasters.id, partnerId: partners["toastmasters-international"].id, isPartnerResource: true, title: "About the Speechcraft programme", type: "ARTICLE", url: "https://www.toastmasters.org", description: "Overview of Toastmasters' Speechcraft introduction to public speaking." },
      { clubId: clubs.coaching.id, title: "Peer coaching conversation template", type: "TEMPLATE", url: "https://www.pmi.org", description: "A simple GROW-style template for peer coaching conversations." },
      { clubId: clubs["health-safety"].id, title: "Safety across the project life cycle", type: "DOCUMENT", url: "https://www.pmi.org", description: "Checklist: safety in planning & risk, execution & stakeholders, governance & closeout." },
      { clubId: clubs.rotary.id, title: "Impact storytelling canvas", type: "TEMPLATE", url: "https://www.pmi.org", description: "Problem · People · Results · Lessons — document community projects consistently." },
      { title: "PMI Uganda Chapter", type: "LINK", url: "https://pmiuganda.org", description: "The chapter's official website." },
      { title: "PMI volunteering", type: "LINK", url: "https://www.pmi.org/membership/volunteer", description: "Find volunteer opportunities across the PMI community." },
    ],
  });

  await db.setting.createMany({
    data: [
      { key: "siteName", value: "PMI Uganda Clubs" },
      { key: "tagline", value: "Connect. Participate. Grow. Impact." },
      { key: "contactEmail", value: "clubs@pmiuganda.org" },
    ],
  });

  if (WITH_DEMO && member) {
    // Club Captains (placeholders until the five captains are confirmed in October)
    for (const slug of Object.keys(clubs)) {
      const name = clubsData.find((c) => c.slug === slug)!.shortName;
      const captain = await mkUser(`captain.${slug}@pmiuganda.test`, `${name} Club Captain`, { jobTitle: "Club Captain" });
      await db.clubRole.create({ data: { userId: captain.id, clubId: clubs[slug].id, role: "CLUB_LEAD", title: "Club Captain" } });
      await db.clubMembership.create({ data: { userId: captain.id, clubId: clubs[slug].id, status: "ACTIVE", joinedAt: at("2026-09-20T10:00") } });
    }
    const coordinator = await mkUser("events.fitness@pmiuganda.test", "Fitness Event Coordinator", {});
    await db.clubRole.create({ data: { userId: coordinator.id, clubId: clubs.fitness.id, role: "EVENT_COORDINATOR", title: "Event Coordinator" } });
    const warmup = await ev("fitness", {
      title: "Launch Week Warm-up Walk", initiativeId: fitI.id, activityId: fitRuns.id,
      summary: "An easy 5 km walk to kick off the PMI Uganda Clubs launch.",
      description: "Meet fellow project professionals for a relaxed 5 km walk around Kololo. All fitness levels welcome.",
      startsAt: at("2026-09-27T07:00"), endsAt: at("2026-09-27T09:00"), locationName: "Kololo Independence Grounds, Kampala",
      mapUrl: "https://maps.google.com/?q=Kololo+Independence+Grounds", mode: "PHYSICAL", capacity: 60, bannerUrl: "/images/clubs/fitness.jpg",
    });
    // ─── Demo community members ─────────────────────────────────────────
    const names = [
      "Grace Namubiru", "Joseph Okello", "Sarah Achieng", "David Mugisha", "Ruth Nakato", "Brian Ssemwogerere",
      "Esther Atim", "Patrick Byaruhanga", "Juliet Kemigisha", "Ivan Kato", "Agnes Nabirye", "Moses Opio",
    ];
    const slugs = Object.keys(clubs);
    const demo: { id: string }[] = [];
    for (const [i, n] of names.entries()) {
      const u = await mkUser(`${n.split(" ")[0].toLowerCase()}@example.test`, n, {
        jobTitle: ["Project Manager", "Programme Officer", "Engineer", "Business Analyst"][i % 4],
        certifications: i % 3 === 0 ? "PMP" : i % 3 === 1 ? "CAPM" : "",
        interests: "Leadership, Agile",
        createdAt: new Date(Date.now() - (40 - i * 3) * 86400_000),
        lastActiveAt: new Date(Date.now() - i * 2 * 86400_000),
      });
      demo.push(u);
      const mine = [slugs[i % 5], slugs[(i + 2) % 5]].slice(0, i % 3 === 0 ? 1 : 2);
      for (const s of mine) {
        const pending = s === "coaching" && i % 4 === 0;
        await db.clubMembership.create({
          data: { userId: u.id, clubId: clubs[s].id, status: pending ? "PENDING" : "ACTIVE", joinedAt: pending ? null : at("2026-09-25T10:00"), motivation: pending ? "I want to become a certified peer coach." : null },
        });
      }
    }

    // Christopher: Toastmasters, Fitness, Coaching (PRD example profile)
    for (const s of ["toastmasters", "fitness", "coaching"]) {
      await db.clubMembership.create({ data: { userId: member.id, clubId: clubs[s].id, status: "ACTIVE", joinedAt: at("2026-09-24T09:00") } });
    }

    // Past warm-up walk: registrations + attendance
    for (const u of [member, ...demo.slice(0, 8)]) {
      await db.eventRegistration.create({ data: { eventId: warmup.id, userId: u.id, ticketCode: ticket() } });
    }
    for (const u of [member, ...demo.slice(0, 6)]) {
      await db.eventAttendance.create({ data: { eventId: warmup.id, userId: u.id, method: "QR", checkedInAt: at("2026-09-27T07:05"), checkedInById: coordinator.id } });
    }
    // Upcoming run registrations
    for (const u of [member, ...demo.slice(2, 9)]) {
      await db.eventRegistration.create({ data: { eventId: run.id, userId: u.id, ticketCode: ticket() } });
    }
    await db.notification.createMany({
      data: [
        { userId: member.id, kind: "REMINDER", title: "Saturday Fitness Run is this weekend", body: "3 October · 7:00 AM · Kololo", link: `/events/${run.id}` },
        { userId: member.id, kind: "ANNOUNCEMENT", title: "Coaching cohort recruitment is open", link: "/news/coaching-cohort-recruitment-open" },
      ],
    });
  }

  console.log(`Seeded${WITH_DEMO ? " with demo people (see DEMO_PASSWORD in prisma/seed.ts)" : " (production: no demo people)"}.`);
  console.log({ platformAdmin: superAdmin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
