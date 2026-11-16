import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { TagDto } from './post-response.dto.js';
import { PostsService } from './posts.service.js';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List the tags used by posts' })
  @ApiOkResponse({ description: 'Tags with their post counts.', type: [TagDto] })
  list() {
    return this.postsService.listTags();
  }
}
