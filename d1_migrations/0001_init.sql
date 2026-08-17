-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "passwordHash" TEXT,
    "menarcheDate" DATETIME,
    "adatHaid" INTEGER NOT NULL DEFAULT 6,
    "adatSuci" INTEGER NOT NULL DEFAULT 23,
    "mustahadahCat" TEXT NOT NULL DEFAULT 'MUBTADAAH_MUMAYYIZAH',
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isGuest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BloodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "colorWeight" INTEGER NOT NULL,
    "colorLabel" TEXT NOT NULL,
    "traitWeight" INTEGER NOT NULL,
    "traitLabel" TEXT NOT NULL,
    "isKapasPutih" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BloodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QadaEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "prayerName" TEXT NOT NULL,
    "prayerDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QadaEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BloodLog_userId_startTime_idx" ON "BloodLog"("userId", "startTime");

-- CreateIndex
CREATE INDEX "QadaEntry_userId_prayerDate_idx" ON "QadaEntry"("userId", "prayerDate");

