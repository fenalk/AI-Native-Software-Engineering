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

const POST_ID = '9f0c5b8e-9a2f-4c5e-8a1b-3d6f7e8c9a0b'

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
    const post = { id: POST_ID }
    apiClient.get.mockResolvedValue({ data: post })

    await expect(getPost(POST_ID)).resolves.toEqual(post)
    expect(apiClient.get).toHaveBeenCalledWith(`/posts/${POST_ID}`)
  })

  it.each(['..', '%2F', '', 'not-a-uuid', `${POST_ID}/../..`])(
    'refuses to build a request for the invalid id %j',
    async (postId) => {
      // Interpolating the segment let `/posts/..` become `GET /` on the API.
      await expect(getPost(postId)).rejects.toThrow('Invalid post id')
      await expect(likePost(postId)).rejects.toThrow('Invalid post id')
      await expect(unlikePost(postId)).rejects.toThrow('Invalid post id')
      await expect(listComments(postId)).rejects.toThrow('Invalid post id')

      expect(apiClient.get).not.toHaveBeenCalled()
      expect(apiClient.post).not.toHaveBeenCalled()
      expect(apiClient.delete).not.toHaveBeenCalled()
    },
  )

  it('creates a post', async () => {
    const input = { title: 'Título' }
    apiClient.post.mockResolvedValue({ data: { id: POST_ID } })

    await expect(createPost(input)).resolves.toEqual({ id: POST_ID })
    expect(apiClient.post).toHaveBeenCalledWith('/posts', input)
  })

  it('likes and unlikes a post', async () => {
    apiClient.post.mockResolvedValue({})
    apiClient.delete.mockResolvedValue({})

    await likePost(POST_ID)
    await unlikePost(POST_ID)

    expect(apiClient.post).toHaveBeenCalledWith(`/posts/${POST_ID}/likes`)
    expect(apiClient.delete).toHaveBeenCalledWith(`/posts/${POST_ID}/likes`)
  })

  it('lists and creates comments', async () => {
    apiClient.get.mockResolvedValue({ data: [] })
    apiClient.post.mockResolvedValue({ data: { id: 'comment-1' } })

    await expect(listComments(POST_ID)).resolves.toEqual([])
    await expect(
      createComment(POST_ID, { body: 'Oi', parentId: 'comment-0' }),
    ).resolves.toEqual({ id: 'comment-1' })

    expect(apiClient.get).toHaveBeenCalledWith(`/posts/${POST_ID}/comments`)
    expect(apiClient.post).toHaveBeenCalledWith(`/posts/${POST_ID}/comments`, {
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
