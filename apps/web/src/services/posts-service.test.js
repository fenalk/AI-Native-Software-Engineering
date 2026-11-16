import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./api-client.js', () => ({
  apiClient: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from './api-client.js'
import {
  createComment,
  createPost,
  getPost,
  likePost,
  listComments,
  listPosts,
  listTags,
  unlikePost,
} from './posts-service.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('posts-service', () => {
  it('lists posts with filters and pagination', async () => {
    const page = { items: [], page: 1, limit: 12, total: 0 }
    apiClient.get.mockResolvedValue({ data: page })

    await expect(
      listPosts({
        search: 'react',
        tags: ['react', 'css'],
        sort: 'popular',
        page: 2,
        limit: 12,
      }),
    ).resolves.toEqual(page)

    expect(apiClient.get).toHaveBeenCalledWith('/posts', {
      params: {
        search: 'react',
        tags: 'react,css',
        sort: 'popular',
        page: 2,
        limit: 12,
      },
    })
  })

  it('omits empty filters', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } })

    await listPosts()

    expect(apiClient.get).toHaveBeenCalledWith('/posts', {
      params: { sort: 'recent', page: 1, limit: 12 },
    })
  })

  it('reads a post', async () => {
    const post = { id: 'post-1' }
    apiClient.get.mockResolvedValue({ data: post })

    await expect(getPost('post-1')).resolves.toEqual(post)
    expect(apiClient.get).toHaveBeenCalledWith('/posts/post-1')
  })

  it('creates a post', async () => {
    const input = { title: 'Título' }
    apiClient.post.mockResolvedValue({ data: { id: 'post-1' } })

    await expect(createPost(input)).resolves.toEqual({ id: 'post-1' })
    expect(apiClient.post).toHaveBeenCalledWith('/posts', input)
  })

  it('likes and unlikes a post', async () => {
    apiClient.post.mockResolvedValue({})
    apiClient.delete.mockResolvedValue({})

    await likePost('post-1')
    await unlikePost('post-1')

    expect(apiClient.post).toHaveBeenCalledWith('/posts/post-1/likes')
    expect(apiClient.delete).toHaveBeenCalledWith('/posts/post-1/likes')
  })

  it('lists and creates comments', async () => {
    apiClient.get.mockResolvedValue({ data: [] })
    apiClient.post.mockResolvedValue({ data: { id: 'comment-1' } })

    await expect(listComments('post-1')).resolves.toEqual([])
    await expect(
      createComment('post-1', { body: 'Oi', parentId: 'comment-0' }),
    ).resolves.toEqual({ id: 'comment-1' })

    expect(apiClient.get).toHaveBeenCalledWith('/posts/post-1/comments')
    expect(apiClient.post).toHaveBeenCalledWith('/posts/post-1/comments', {
      body: 'Oi',
      parentId: 'comment-0',
    })
  })

  it('lists tags', async () => {
    apiClient.get.mockResolvedValue({ data: [] })

    await listTags()

    expect(apiClient.get).toHaveBeenCalledWith('/tags')
  })
})
