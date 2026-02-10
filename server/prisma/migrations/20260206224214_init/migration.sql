-- CreateTable
CREATE TABLE "Endpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostname" TEXT NOT NULL,
    "user" TEXT,
    "ip" TEXT,
    "lastSeen" DATETIME,
    "os" TEXT,
    "inVicarius" BOOLEAN NOT NULL DEFAULT false,
    "inCortex" BOOLEAN NOT NULL DEFAULT false,
    "inWarp" BOOLEAN NOT NULL DEFAULT false,
    "inPam" BOOLEAN NOT NULL DEFAULT false,
    "inJumpCloud" BOOLEAN NOT NULL DEFAULT false,
    "isNonCompliant" BOOLEAN NOT NULL DEFAULT false,
    "isTerminated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OffboardingAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "vicariusCount" INTEGER NOT NULL DEFAULT 0,
    "cortexCount" INTEGER NOT NULL DEFAULT 0,
    "warpCount" INTEGER NOT NULL DEFAULT 0,
    "pamCount" INTEGER NOT NULL DEFAULT 0,
    "jumpcloudCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ApiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolName" TEXT NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "lastSync" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_hostname_key" ON "Endpoint"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "ApiConfig_toolName_key" ON "ApiConfig"("toolName");
