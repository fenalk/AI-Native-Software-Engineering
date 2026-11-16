import { apiClient } from './api-client.js'

/**
 * Lists posts with the backend filters. `tags` is an array of slugs; the API
 * expects a comma-separated string and applies AND semantics.
 */
export async function listPosts({
  search,
  tags = [],
  sort = 'recent',
  page = 1,
  limit = 12,
} = {}) {
  const params = { sort, page, limit }

  if (search) {
    params.search = search
  }

  if (tags.length > 0) {
    params.tags = tags.join(',')
  }

  const { data } = await apiClient.get('/posts', { params })

  return data
}

/** Reads a single post, including its code/content. */
export async function getPost(postId) {
  const { data } = await apiClient.get(`/posts/${postId}`)

  return data
}

/** Publishes a post; the API answers 201 with the created resource. */
export async function createPost(input) {
  const { data } = await apiClient.post('/posts', input)

  return data
}

/** Likes a post. The API is idempotent and answers 204. */
export async function likePost(postId) {
  await apiClient.post(`/posts/${postId}/likes`)
}

/** Removes the like. The API is idempotent and answers 204. */
export async function unlikePost(postId) {
  await apiClient.delete(`/posts/${postId}/likes`)
}

/** Lists the comments of a post; replies carry `parentId`. */
export async function listComments(postId) {
  const { data } = await apiClient.get(`/posts/${postId}/comments`)

  return data
}

/** Creates a top-level comment or a reply. */
export async function createComment(postId, input) {
  const { data } = await apiClient.post(`/posts/${postId}/comments`, input)

  return data
}

/** Lists the tags used by posts, with their post counts. */
export async function listTags() {
  const { data } = await apiClient.get('/tags')

  return data
}
