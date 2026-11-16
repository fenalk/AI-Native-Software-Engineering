import { ApiProperty } from '@nestjs/swagger';

export class PostAuthorDto {
  @ApiProperty({ example: '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b' })
  id: string;

  @ApiProperty({ example: 'Julio' })
  name: string;

  @ApiProperty({ example: 'julio' })
  username: string;

  @ApiProperty({ example: '/seed/avatars/julio.png', nullable: true, type: String })
  avatarUrl: string | null;
}

export class PostTagDto {
  @ApiProperty({ example: 'react' })
  slug: string;

  @ApiProperty({ example: 'React' })
  name: string;
}

export class PostSummaryDto {
  @ApiProperty({ example: '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b' })
  id: string;

  @ApiProperty({ example: 'Design system com React' })
  title: string;

  @ApiProperty({ example: 'Um resumo curto do post.' })
  description: string;

  @ApiProperty({
    description: 'Thumbnail URL; `null` renders the placeholder.',
    example: '/seed/feed-01.png',
    nullable: true,
    type: String,
  })
  thumbnailUrl: string | null;

  @ApiProperty({ type: PostAuthorDto })
  author: PostAuthorDto;

  @ApiProperty({ type: [PostTagDto] })
  tags: PostTagDto[];

  @ApiProperty({ example: 12 })
  likesCount: number;

  @ApiProperty({ example: 3 })
  commentsCount: number;

  @ApiProperty({
    description: 'Whether the signed-in user liked the post.',
    example: false,
  })
  likedByMe: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-16T12:00:00.000Z',
  })
  createdAt: Date;
}

export class PostDetailDto extends PostSummaryDto {
  @ApiProperty({ example: 'const compose = (...fns) => ...' })
  content: string;
}

export class PostListDto {
  @ApiProperty({ type: [PostSummaryDto] })
  items: PostSummaryDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 8 })
  total: number;
}

export class CommentAuthorDto extends PostAuthorDto {}

export class CommentDto {
  @ApiProperty({ example: '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b' })
  id: string;

  @ApiProperty({ example: 'Muito bom!' })
  body: string;

  @ApiProperty({
    description: 'Top-level comment this one replies to, when any.',
    example: null,
    nullable: true,
    type: String,
  })
  parentId: string | null;

  @ApiProperty({ type: CommentAuthorDto })
  author: CommentAuthorDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-16T12:00:00.000Z',
  })
  createdAt: Date;
}

export class TagDto {
  @ApiProperty({ example: 'react' })
  slug: string;

  @ApiProperty({ example: 'React' })
  name: string;

  @ApiProperty({ example: 5 })
  postCount: number;
}
