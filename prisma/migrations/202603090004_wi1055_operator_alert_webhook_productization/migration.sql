ALTER TABLE "Organization"
ADD COLUMN "operatorAlertWebhookUrl" TEXT,
ADD COLUMN "operatorAlertWebhookProvider" TEXT,
ADD COLUMN "approvalEscalationUseOperatorAlertWebhook" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "leavePromotionUseOperatorAlertWebhook" BOOLEAN NOT NULL DEFAULT true;
