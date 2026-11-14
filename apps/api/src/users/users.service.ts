import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PasswordHasherService } from './password-hasher.service.js';
import { normalizeEmail, toUser, type User, type UserRecord } from './user.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UserCredentials {
  user: User;
  passwordHash: string;
}

/**
 * Users kept in memory: they are gone when the API restarts, which is the
 * agreed trade-off until a database comes in.
 */
@Injectable()
export class UsersService {
  private readonly records: UserRecord[] = [];

  constructor(private readonly passwordHasher: PasswordHasherService) {}

  async create({ name, email, password }: CreateUserInput): Promise<User> {
    const normalizedEmail = normalizeEmail(email);
    this.assertEmailIsFree(normalizedEmail);

    const passwordHash = await this.passwordHasher.hash(password);

    // Registering is async, so check again now that the hash is ready: the
    // email could have been taken while this call awaited it.
    this.assertEmailIsFree(normalizedEmail);

    const record: UserRecord = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date(),
    };

    this.records.push(record);
    return toUser(record);
  }

  findById(id: string): User | null {
    const record = this.records.find((candidate) => candidate.id === id);
    return record ? toUser(record) : null;
  }

  getById(id: string): User {
    const user = this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /** Only for sign-in, which needs the hash to compare against. */
  findCredentials(email: string): UserCredentials | null {
    const normalizedEmail = normalizeEmail(email);
    const record = this.records.find(
      (candidate) => candidate.email === normalizedEmail,
    );

    return record
      ? { user: toUser(record), passwordHash: record.passwordHash }
      : null;
  }

  /** Throws when the user is gone, so the caller can answer `401`. */
  getCredentials(id: string): UserCredentials {
    const record = this.records.find((candidate) => candidate.id === id);
    if (!record) {
      throw new UnauthorizedException('Invalid access token');
    }

    return { user: toUser(record), passwordHash: record.passwordHash };
  }

  private assertEmailIsFree(email: string): void {
    const taken = this.records.some((record) => record.email === email);
    if (taken) {
      throw new ConflictException('Email already registered');
    }
  }
}
