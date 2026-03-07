# Contracts Test Cases (Contract v0.2.1)

1. Create contract template and verify version starts at 1.
2. Update template name/body/category and verify version increments when content changes.
3. Archive contract template via `DELETE /contracts/templates/{templateId}` and verify `template.isArchived` becomes `true`.
4. Archived template is excluded from `GET /contracts/templates` results.
5. `DELETE /contracts/templates/{unknownId}` returns `404`.
6. Create contract document draft for employee/template and verify deterministic `documentHash` is returned.
7. Request approval for draft document and verify state changes to `APPROVAL_REQUESTED` with `approvalStatus=PENDING`.
8. Apply approval action and verify approval execution state maps into contract `approvalStatus`.
9. Reject approval and verify document returns to `DRAFT` with `approvalStatus=REJECTED`.
10. Approve approval and verify document returns to send-ready `DRAFT` with `approvalStatus=APPROVED`.
11. Attempt send before approval when required and verify `409` guard.
12. Send approved document and verify status changes to `SENT`.
13. Employee list API returns only own documents.
14. Employee SIGN response stores deterministic `signatureHash` and `signatureEvidenceHash`.
15. Employee response with mismatched `expectedDocumentHash` returns `409`.
16. Employee cannot respond to another employee document (`403`).
17. Manual expire operation transitions SENT document to `EXPIRED`.
18. Renew operation from terminal document creates a new DRAFT document and marks source as `RENEWED`.
19. Signed-contract signature evidence read/download API returns deterministic artifact metadata/content (`format=json|text`, `contentSha256`) and blocks non-owner employee access (`403`).
