import { Router } from 'express';
import platformAdminRoutes from '../modules/admin/admin.routes.js';
import { adminSosRouter } from '../modules/sos/sos.routes.js';

const router = Router();

/**
 * ==============================================================================
 * 🛡️ PLATFORM ADMINISTRATION GATEWAY (/api/v1/admin/...)
 * ==============================================================================
 * Used by the SHARE2GO Admin Web Dashboard (sharingwalaadmin) to control:
 * - Staff authentication & RBAC permissions (/auth/...)
 * - Dashboard KPIs & Real-time analytics (/dashboard/...)
 * - User management & account statuses (/users/...)
 * - Driver KYC & document verifications (/drivers/...)
 * - Vehicle registration & insurance approvals (/vehicles/...)
 * - Ride cancellations & passenger oversight (/rides/...)
 * - Stranger Mode trip oversight (/trips/...)
 * - Emergency SOS incident monitoring & dispatch (/sos/...)
 * - Support ticket resolutions (/tickets/...)
 * - Dynamic pricing guardrails & commission rules (/pricing/...)
 * - In-app promotional banners & app config (/banners/...)
 * - Comprehensive system audit logs (/audit-logs/...)
 * ==============================================================================
 */

// 🚨 Emergency SOS Administration
router.use('/admin/sos', adminSosRouter);

// 🛡️ Core Platform Administration Endpoints
router.use('/admin', platformAdminRoutes);

export default router;

