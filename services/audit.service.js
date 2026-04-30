const AuditLog = require('../models/AuditLog.model');

const log = ({ asset, performedBy, action, description, changes, relatedModel, relatedId, ipAddress, session }) => {
  const entry = {
    asset,
    performedBy,
    action,
    description,
    changes: changes || null,
    relatedModel: relatedModel || null,
    relatedId: relatedId || null,
    ipAddress: ipAddress || null,
  };

  // pass session if inside a transaction
  return session ? AuditLog.create([entry], { session }) : AuditLog.create(entry);
};

module.exports = { log };
