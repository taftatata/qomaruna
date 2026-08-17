// Reset existing demo user to onboarded=false so we can test the onboarding flow
import { db } from "../src/lib/db";

async function main() {
  const user = await db.user.findUnique({ where: { uid: "demo-user-1" } });
  if (!user) {
    console.log("Demo user not found — skipping.");
    return;
  }
  await db.bloodLog.deleteMany({ where: { userId: user.id } });
  await db.qadaEntry.deleteMany({ where: { userId: user.id } });
  await db.user.update({
    where: { uid: "demo-user-1" },
    data: { onboarded: false, isGuest: true, menarcheDate: null },
  });
  console.log("Demo user reset — onboarded=false, bloodLogs & qada cleared.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
