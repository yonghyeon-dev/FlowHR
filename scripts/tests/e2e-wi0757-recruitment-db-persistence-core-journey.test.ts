import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const prismaSchema = readUtf8("prisma", "schema.prisma");
  const dataAccessSource = readUtf8("src", "features", "shared", "data-access.ts");
  const prismaDataAccessSource = readUtf8("src", "features", "shared", "prisma-data-access.ts");
  const memoryDataAccessSource = readUtf8("src", "features", "shared", "memory-data-access.ts");
  const recruitmentStoreSource = readUtf8("src", "features", "recruitment", "store.ts");
  const referralsRoute = readUtf8("src", "app", "api", "recruitment", "referrals", "route.ts");
  const stageRoute = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "referrals",
    "[referralId]",
    "stage",
    "route.ts"
  );
  const withdrawRoute = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "referrals",
    "[referralId]",
    "withdraw",
    "route.ts"
  );
  const workItem = readUtf8("work-items", "WI-0757-recruitment-db-persistence-core-journey.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(prismaSchema, /model RecruitmentOpening \{/);
  assert.match(prismaSchema, /model RecruitmentReferral \{/);
  assert.match(prismaSchema, /enum RecruitmentOpeningStatus \{/);
  assert.match(prismaSchema, /enum RecruitmentReferralStage \{/);

  assert.match(dataAccessSource, /export interface RecruitmentStore/);
  assert.match(dataAccessSource, /recruitment: RecruitmentStore/);
  assert.match(prismaDataAccessSource, /const recruitment: RecruitmentStore/);
  assert.match(memoryDataAccessSource, /recruitment: \{/);

  assert.match(recruitmentStoreSource, /dataAccess\.recruitment\./);
  assert.match(referralsRoute, /await listRecruitmentReferrals\(/);
  assert.match(stageRoute, /await updateRecruitmentReferralStage\(/);
  assert.match(withdrawRoute, /await withdrawRecruitmentReferral\(/);

  const recruitmentStore = await import("../../src/features/recruitment/store.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({ name: "Org Recruitment" });

  const opening = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: organization.id,
      title: "플랫폼 백엔드 엔지니어",
      department: "플랫폼",
      employmentType: "정규직"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.ok(opening.id.length > 0);
  assert.equal(opening.organizationId, organization.id);

  const foundOpening = await recruitmentStore.findRecruitmentOpening(opening.id, {
    dataAccess: memoryDataAccess
  });
  assert.ok(foundOpening);
  assert.equal(foundOpening?.title, "플랫폼 백엔드 엔지니어");

  const referral = await recruitmentStore.createRecruitmentReferral(
    {
      organizationId: organization.id,
      openingId: opening.id,
      candidateName: "홍길동",
      candidateEmail: "hong@example.com",
      referrerEmployeeId: "EMP-REC-1",
      note: "대규모 트래픽 경험"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(referral.stage, "SUBMITTED");

  const screening = await recruitmentStore.updateRecruitmentReferralStage(
    {
      referralId: referral.id,
      stage: "SCREENING"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(screening?.stage, "SCREENING");

  const withdrawn = await recruitmentStore.withdrawRecruitmentReferral(
    {
      referralId: referral.id,
      actorId: "EMP-REC-1"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(withdrawn?.stage, "WITHDRAWN");

  const referrals = await recruitmentStore.listRecruitmentReferrals(
    {
      organizationId: organization.id
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(referrals.length, 1);

  const summary = recruitmentStore.summarizeRecruitmentReferrals(referrals);
  assert.equal(summary.total, 1);
  assert.equal(summary.withdrawn, 1);

  assert.match(workItem, /WI-0757/i);
  assert.match(workItem, /recruitment|db|persistence|opening|referral|core journey/i);
  assert.match(roadmap, /WI-0757/i);
}

run()
  .then(() => {
    console.log("e2e-wi0757-recruitment-db-persistence-core-journey.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
