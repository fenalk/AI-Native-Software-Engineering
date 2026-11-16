import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsRepository } from './posts.repository.js';
import { PostsService } from './posts.service.js';
import { TagsController } from './tags.controller.js';

@Module({
  controllers: [PostsController, TagsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
