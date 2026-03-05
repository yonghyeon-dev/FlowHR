ALTER TABLE "OnboardingTask" RENAME TO "employee_onboarding_tasks";

CREATE TABLE "onboarding_task_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_task_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_task_templates_title_key" ON "onboarding_task_templates"("title");
CREATE INDEX "onboarding_task_templates_sort_order_created_at_id_idx" ON "onboarding_task_templates"("sortOrder", "createdAt", "id");
