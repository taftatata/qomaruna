// Reset existing demo user to isOnboarded=false so we can test the onboarding flow
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
    data: { isOnboarded: false, isGuest: true, menarcheDate: null },
  });
  console.log("Demo user reset — isOnboarded=false, bloodLogs & qada cleared.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
