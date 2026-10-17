import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

async function main() {
  console.log('🌱 Starting Prisma database seeding...');

  // 1. Seed Admin Roles
  const superAdminRole = await prisma.adminRole.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full system access with all administrative privileges',
    },
  });

  const verificationAdminRole = await prisma.adminRole.upsert({
    where: { name: 'VERIFICATION_ADMIN' },
    update: {},
    create: {
      name: 'VERIFICATION_ADMIN',
      description: 'Specialized staff reviewing driver licenses and vehicle registrations',
    },
  });

  const supportAdminRole = await prisma.adminRole.upsert({
    where: { name: 'SUPPORT_ADMIN' },
    update: {},
    create: {
      name: 'SUPPORT_ADMIN',
      description: 'Customer support staff reviewing user safety reports and disputes',
    },
  });

  // 2. Seed Admin Permissions
  const permissionsList = [
    { name: 'users.view', description: 'View user profiles, phone, and verification statuses' },
    { name: 'users.update', description: 'Update user account information and notes' },
    { name: 'users.block', description: 'Suspend or block malicious user accounts' },
    { name: 'drivers.verify', description: 'Approve or reject submitted driver licenses' },
    { name: 'vehicles.verify', description: 'Approve or reject vehicle RC cards and insurance' },
    { name: 'rides.view', description: 'Inspect all active, completed, and recurring rides' },
    { name: 'rides.cancel', description: 'Admin force-cancellation of problematic rides' },
    { name: 'reports.view', description: 'View safety complaints and incident reports' },
    { name: 'reports.resolve', description: 'Take resolution action on safety reports' },
  ];

  for (const perm of permissionsList) {
    const createdPerm = await prisma.adminPermission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });

    // Link all to Super Admin
    await prisma.adminRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: createdPerm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: createdPerm.id,
      },
    });
  }

  // 3. Seed Pricing Rules (Non-commercial fuel cost sharing guardrails)
  await prisma.pricingRule.createMany({
    data: [
      {
        vehicleType: 'CAR',
        minimumDistanceKm: 2.0,
        maximumDistanceKm: 1500.0,
        ratePerKm: 3.5,
        maxContributionPerKm: 5.0,
        isActive: true,
      },
      {
        vehicleType: 'BIKE',
        minimumDistanceKm: 1.0,
        maximumDistanceKm: 300.0,
        ratePerKm: 1.5,
        maxContributionPerKm: 2.5,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // 4. Seed Scenario User 1: Sai (Driver)
  const defaultPassword = await bcrypt.hash('Secret@123', 10);

  const sai = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      username: 'sai_commuter',
      displayName: 'Sai Krishna',
      phone: '+919876543210',
      email: 'sai@techcorp.com',
      passwordHash: defaultPassword,
      gender: 'MALE',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  // 5. Driver Profile for Sai
  const saiDriverProfile = await prisma.driverProfile.upsert({
    where: { userId: sai.id },
    update: {},
    create: {
      userId: sai.id,
      licenseNumber: 'TS0920210045892',
      licenseExpiryDate: new Date('2035-12-31'),
      licenseVerifiedAt: new Date(),
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      totalRidesOffered: 14,
      averageRating: 4.95,
    },
  });

  // 6. Sai's Vehicles (Car: Honda City, Bike: Royal Enfield)
  const hondaCity = await prisma.vehicle.upsert({
    where: { registrationNumber: 'TS08EM1234' },
    update: {},
    create: {
      driverId: saiDriverProfile.id,
      vehicleType: 'CAR',
      registrationNumber: 'TS08EM1234',
      make: 'Honda',
      model: 'City ZX',
      year: 2022,
      color: 'Pearl White',
      seatCapacity: 4,
      fuelType: 'PETROL',
      hasAc: true,
      luggageCapacity: 'MEDIUM',
      status: 'APPROVED',
      verifiedAt: new Date(),
    },
  });

  await prisma.vehicle.upsert({
    where: { registrationNumber: 'TS08EK5678' },
    update: {},
    create: {
      driverId: saiDriverProfile.id,
      vehicleType: 'BIKE',
      registrationNumber: 'TS08EK5678',
      make: 'Royal Enfield',
      model: 'Classic 350',
      year: 2023,
      color: 'Stealth Black',
      seatCapacity: 1,
      fuelType: 'PETROL',
      helmetProvided: true,
      status: 'APPROVED',
      verifiedAt: new Date(),
    },
  });

  // 7. Seed Community
  const techCommunity = await prisma.community.upsert({
    where: { uuid: 'c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c' },
    update: {},
    create: {
      uuid: 'c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c',
      name: 'Hyderabad Tech Park Commuters',
      type: 'OFFICE',
      description: 'Verified daily commuters working across HITEC City and Madhapur',
      domainRestriction: '@techcorp.com',
      isActive: true,
      createdBy: sai.id,
    },
  });

  await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId: techCommunity.id,
        userId: sai.id,
      },
    },
    update: {},
    create: {
      communityId: techCommunity.id,
      userId: sai.id,
      role: 'ADMIN',
      isApproved: true,
    },
  });

  // 8. Scenario User 2: Ravi (Passenger)
  const ravi = await prisma.user.upsert({
    where: { phone: '+919123456789' },
    update: {},
    create: {
      username: 'ravi_tech',
      displayName: 'Ravi Teja',
      phone: '+919123456789',
      email: 'ravi@inbox.com',
      passwordHash: defaultPassword,
      gender: 'MALE',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });

  console.log('✅ Prisma database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
