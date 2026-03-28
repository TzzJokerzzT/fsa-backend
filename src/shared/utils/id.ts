import { Types } from 'mongoose';

/**
 * Generates a new MongoDB ObjectId as string
 */
export function generateId(): string {
  return new Types.ObjectId().toHexString();
}

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toHexString() === id;
}

/**
 * Converts string to ObjectId
 */
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
