import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'Token to send as `Authorization: Bearer <accessToken>`.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjBjIn0.aGVsbG8',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Scheme of the `Authorization` header.',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Lifetime of the token, in seconds.',
    example: 3600,
  })
  expiresIn: number;
}
