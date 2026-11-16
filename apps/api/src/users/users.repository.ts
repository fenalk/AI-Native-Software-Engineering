import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { users, type UserRow } from '../db/schema.js';

/** Every query the users feature runs against PostgreSQL. */
@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findById(id: string): Promise<UserRow | null> {
    const [record] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return record ?? null;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const [record] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return record ?? null;
  }

  /**
   * Returns `null` when the email is already taken. The unique constraint
   * decides the winner, so concurrent registrations cannot both succeed.
   */
  async insert(record: UserRow): Promise<UserRow | null> {
    const [created] = await this.db
      .insert(users)
      .values(record)
      .onConflictDoNothing()
      .returning();

    return created ?? null;
  }
}
