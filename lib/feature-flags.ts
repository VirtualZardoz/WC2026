import { prisma } from './prisma';

export const FEATURE_FLAGS = {
  REGISTRATION_ENABLED: 'REGISTRATION_ENABLED',
};

export async function isRegistrationEnabled(): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: FEATURE_FLAGS.REGISTRATION_ENABLED },
  });
  
  // Default to true if not set
  return setting?.value ?? true;
}

export async function setRegistrationEnabled(enabled: boolean): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: FEATURE_FLAGS.REGISTRATION_ENABLED },
    update: { value: enabled },
    create: { key: FEATURE_FLAGS.REGISTRATION_ENABLED, value: enabled },
  });
}
