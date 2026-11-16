import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user.',
    example: '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b',
  })
  id: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  email: string;

  @ApiProperty({
    description: 'Public handle, without the leading @.',
    example: 'ada-lovelace',
  })
  username: string;

  @ApiProperty({
    description: 'Avatar URL, when the account has one.',
    example: null,
    nullable: true,
    type: String,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'When the user was registered.',
    type: String,
    format: 'date-time',
    example: '2026-11-13T12:00:00.000Z',
  })
  createdAt: Date;
}
