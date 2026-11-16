import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PasswordHasherService } from './password-hasher.service.js';
import { normalizeEmail, toUser, type User, type UserRecord } from './user.js';
import { UsersRepository } from './users.repository.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UserCredentials {
  user: User;
  passwordHash: string;
}

/** Users live in PostgreSQL; the `users.email` unique index enforces uniqueness. */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async create({ name, email, password }: CreateUserInput): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(password);

    const record: UserRecord = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizeEmail(email),
      passwordHash,
      username: null,
      avatarUrl: null,
      createdAt: new Date(),
    };

    // `insert` returns null when another request took the email while this one
    // hashed the password, so the database settles the race for us.
    const created = await this.usersRepository.insert(record);
    if (!created) {
      throw new ConflictException('Email already registered');
    }

    return toUser(created);
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.usersRepository.findById(id);
    return record ? toUser(record) : null;
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /** Only for sign-in, which needs the hash to compare against. */
  async findCredentials(email: string): Promise<UserCredentials | null> {
    const record = await this.usersRepository.findByEmail(
      normalizeEmail(email),
    );

    return record
      ? { user: toUser(record), passwordHash: record.passwordHash }
      : null;
  }

  /** Throws when the user is gone, so the caller can answer `401`. */
  async getCredentials(id: string): Promise<UserCredentials> {
    const record = await this.usersRepository.findById(id);
    if (!record) {
      throw new UnauthorizedException('Invalid access token');
    }

    return { user: toUser(record), passwordHash: record.passwordHash };
  }
}
