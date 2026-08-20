import prisma from '../../infrastructure/database/prisma/client';
import { AppError } from './errorHandler';

export async function requireWorldMember(worldId: string, userId: string | undefined, roles?: string[]): Promise<any> {
  if (!userId) throw new AppError(401, 'Authentication required');
  const membership = await prisma.worldMember.findUnique({
    where: { worldId_userId: { worldId, userId } }
  });

  if (!membership) throw new AppError(403, 'Access denied');
  if (roles && !roles.includes(membership.role)) throw new AppError(403, 'Insufficient permissions');

  return membership;
}

export async function requireManuscriptMember(manuscriptId: string, userId: string | undefined, roles?: string[]): Promise<any> {
  if (!userId) throw new AppError(401, 'Authentication required');
  const membership = await prisma.manuscriptMember.findUnique({
    where: { manuscriptId_userId: { manuscriptId, userId } }
  });

  if (!membership) throw new AppError(403, 'Access denied');
  if (roles && !roles.includes(membership.role)) throw new AppError(403, 'Insufficient permissions');

  return membership;
}