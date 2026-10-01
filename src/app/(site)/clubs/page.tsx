import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ClubCard } from "@/components/cards";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Explore Clubs" };

export default async function ClubsPage() {
  const user = await getCurrentUser();
  const [clubs, mine] = await Promise.all([
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { memberships: { where: { status: "ACTIVE" } } } } } }),
    user ? db.clubMembership.findMany({ where: { userId: user.id, status: "ACTIVE" } }) : [],
  ]);
  const joined = new Set(mine.map((m) => m.clubId));
  return (
    <>
      <PageHeader
        eyebrow="PMI Uganda · Strategic clubs"
        title="Explore Clubs"
        intro="Practical ways for members to grow, connect and contribute — each delivered with a partner who brings complementary expertise. Join one, or join them all."
      />
      <Container className="py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} memberCount={c._count.memberships} joined={joined.has(c.id)} />
          ))}
        </div>
      </Container>
    </>
  );
}
