# Contracts Test Cases (Contract v0.2.0)

1. Create contract template and verify version starts at 1.
2. Update template name/body/category and verify version increments when content changes.
3. Create contract document draft for employee/template and verify deterministic `documentHash` is returned.
4. Request approval for draft document and verify state changes to `APPROVAL_REQUESTED` with `approvalStatus=PENDING`.
5. Apply approval action and verify approval execution state maps into contract `approvalStatus`.
6. Reject approval and verify document returns to `DRAFT` with `approvalStatus=REJECTED`.
7. Approve approval and verify document returns to send-ready `DRAFT` with `approvalStatus=APPROVED`.
8. Attempt send before approval when required and verify `409` guard.
9. Send approved document and verify status changes to `SENT`.
10. Employee list API returns only own documents.
11. Employee SIGN response stores deterministic `signatureHash` and `signatureEvidenceHash`.
12. Employee response with mismatched `expectedDocumentHash` returns `409`.
13. Employee cannot respond to another employee document (`403`).
14. Manual expire operation transitions SENT document to `EXPIRED`.
15. Renew operation from terminal document creates a new DRAFT document and marks source as `RENEWED`.
16. Signed-contract signature evidence read/download API returns deterministic artifact metadata/content (`format=json|text`, `contentSha256`) and blocks non-owner employee access (`403`).
