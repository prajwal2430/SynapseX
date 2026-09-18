"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    AuditAction["USER_REGISTERED"] = "USER_REGISTERED";
    AuditAction["USER_LOGGED_IN"] = "USER_LOGGED_IN";
    AuditAction["USER_LOGGED_OUT"] = "USER_LOGGED_OUT";
    AuditAction["USER_TOKEN_REFRESHED"] = "USER_TOKEN_REFRESHED";
    AuditAction["USER_LOGIN_FAILED"] = "USER_LOGIN_FAILED";
    AuditAction["USER_ROLE_UPDATED"] = "USER_ROLE_UPDATED";
    AuditAction["USER_STATUS_UPDATED"] = "USER_STATUS_UPDATED";
    AuditAction["USER_UPDATED"] = "USER_UPDATED";
    AuditAction["CASE_CREATED"] = "CASE_CREATED";
    AuditAction["CASE_UPDATED"] = "CASE_UPDATED";
    AuditAction["CASE_DELETED"] = "CASE_DELETED";
    AuditAction["CASE_STATUS_CHANGED"] = "CASE_STATUS_CHANGED";
    AuditAction["CASE_MEMBERS_ASSIGNED"] = "CASE_MEMBERS_ASSIGNED";
    AuditAction["EVIDENCE_UPLOADED"] = "EVIDENCE_UPLOADED";
    AuditAction["EVIDENCE_ACCESSED"] = "EVIDENCE_ACCESSED";
    AuditAction["EVIDENCE_DOWNLOADED"] = "EVIDENCE_DOWNLOADED";
    AuditAction["EVIDENCE_VERIFIED"] = "EVIDENCE_VERIFIED";
    AuditAction["EVIDENCE_DELETED"] = "EVIDENCE_DELETED";
    AuditAction["UNAUTHORIZED_ACCESS_ATTEMPT"] = "UNAUTHORIZED_ACCESS_ATTEMPT";
    AuditAction["SYSTEM_CONFIG_UPDATED"] = "SYSTEM_CONFIG_UPDATED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=audit-action.enum.js.map