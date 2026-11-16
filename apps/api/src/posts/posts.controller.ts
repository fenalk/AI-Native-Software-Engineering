import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { OptionalCurrentUser } from '../auth/optional-current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { Public } from '../auth/public.decorator.js';
import {
  ApiProblemBadRequestResponse,
  ApiProblemNotFoundResponse,
  ApiProblemTooManyRequestsResponse,
  ApiProblemUnauthorizedResponse,
} from '../common/api-problem-response.decorator.js';
import { WriteRateLimit } from '../common/rate-limit.js';
import type { User } from '../users/user.js';
import {
  CommentDto,
  PostDetailDto,
  PostListDto,
} from './post-response.dto.js';
import {
  createCommentSchema,
  createPostSchema,
  commentIdSchema,
  listPostsQuerySchema,
  postIdSchema,
  type CreateCommentInput,
  type CreatePostInput,
  type ListPostsQuery,
} from './posts.schemas.js';
import { PostsService } from './posts.service.js';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List posts with full-text search and tag filters' })
  @ApiOkResponse({ description: 'A page of posts.', type: PostListDto })
  @ApiProblemBadRequestResponse()
  list(
    @Query({ schema: listPostsQuerySchema }) query: ListPostsQuery,
    @OptionalCurrentUser() user: User | null,
  ) {
    return this.postsService.list(query, user?.id ?? null);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Read a post with its code' })
  @ApiOkResponse({ description: 'The post.', type: PostDetailDto })
  @ApiProblemNotFoundResponse()
  get(
    @Param('id', { schema: postIdSchema }) id: string,
    @OptionalCurrentUser() user: User | null,
  ) {
    return this.postsService.get(id, user?.id ?? null);
  }

  @Post()
  @WriteRateLimit()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a post' })
  @ApiCreatedResponse({ description: 'The created post.', type: PostDetailDto })
  @ApiProblemBadRequestResponse()
  @ApiProblemUnauthorizedResponse()
  @ApiProblemTooManyRequestsResponse()
  async create(
    @Body({ schema: createPostSchema }) input: CreatePostInput,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const post = await this.postsService.create(input, user.id);
    response.setHeader('Location', `/posts/${post.id}`);
    return post;
  }

  @Post(':id/likes')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a post (idempotent)' })
  @ApiNoContentResponse({ description: 'The post is liked.' })
  @ApiProblemNotFoundResponse()
  @ApiProblemUnauthorizedResponse()
  like(
    @Param('id', { schema: postIdSchema }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.like(id, user.id);
  }

  @Delete(':id/likes')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove the like from a post (idempotent)' })
  @ApiNoContentResponse({ description: 'The post is not liked.' })
  @ApiProblemNotFoundResponse()
  @ApiProblemUnauthorizedResponse()
  unlike(
    @Param('id', { schema: postIdSchema }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.unlike(id, user.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  @ApiOperation({ summary: 'List the comments of a post' })
  @ApiOkResponse({ description: 'The comments.', type: [CommentDto] })
  @ApiProblemNotFoundResponse()
  listComments(@Param('id', { schema: postIdSchema }) id: string) {
    return this.postsService.listComments(id);
  }

  @Post(':id/comments')
  @WriteRateLimit()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comment on a post or reply to a comment' })
  @ApiCreatedResponse({ description: 'The created comment.', type: CommentDto })
  @ApiProblemBadRequestResponse()
  @ApiProblemNotFoundResponse()
  @ApiProblemUnauthorizedResponse()
  @ApiProblemTooManyRequestsResponse()
  async createComment(
    @Param('id', { schema: postIdSchema }) id: string,
    @Body({ schema: createCommentSchema }) input: CreateCommentInput,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const comment = await this.postsService.createComment(id, input, user.id);
    response.setHeader('Location', `/posts/${id}/comments/${comment.id}`);
    return comment;
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments/:commentId')
  @ApiOperation({ summary: 'Read one comment of a post' })
  @ApiOkResponse({ description: 'The comment.', type: CommentDto })
  @ApiProblemNotFoundResponse()
  getComment(
    @Param('id', { schema: postIdSchema }) id: string,
    @Param('commentId', { schema: commentIdSchema }) commentId: string,
  ) {
    return this.postsService.getComment(id, commentId);
  }
}
