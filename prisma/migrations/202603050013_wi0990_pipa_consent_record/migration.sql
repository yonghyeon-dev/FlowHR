-- CreateEnum
CREATE TYPE "PersonalDataConsentType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE');

-- CreateTable
CREATE TABLE "PersonalDataConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "PersonalDataConsentType" NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalDataConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_data_consent_user_type_version_key"
ON "PersonalDataConsent"("userId", "consentType", "version");

-- CreateIndex
CREATE INDEX "PersonalDataConsent_userId_consentedAt_idx"
ON "PersonalDataConsent"("userId", "consentedAt");
