-- WI-0117: Add multi-stage routing definition payload for approval templates.
ALTER TABLE "ApprovalLineTemplate"
  ADD COLUMN IF NOT EXISTS "approvalStagesJson" JSONB;

UPDATE "ApprovalLineTemplate"
SET "approvalStagesJson" = jsonb_build_array(
  jsonb_build_object(
    'stageIndex', 1,
    'label', 'stage-1',
    'approverRoles', to_jsonb("approverRoles"),
    'minApprovals', 1
  )
)
WHERE "approvalStagesJson" IS NULL;

ALTER TABLE "ApprovalLineTemplate"
  ALTER COLUMN "approvalStagesJson" SET NOT NULL;
