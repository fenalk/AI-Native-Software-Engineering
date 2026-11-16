import { apiClient } from './api-client.js'

/**
 * `postId` becomes a path segment, so invalid ids are rejected here instead of
 * being interpolated: `/posts/..` would otherwise resolve to `GET /` on the API.
 */
const POST_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function postPath(postId, suffix = '') {
  if (!POST_PATH.test(String(postId))) {
    throw new Error('Invalid post id')
  }

  return `/posts/${encodeURIComponent(postId)}${suffix}`
}

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
  const { data } = await apiClient.get(postPath(postId))

  return data
}

/** Publishes a post; the API answers 201 with the created resource. */
export async function createPost(input) {
  const { data } = await apiClient.post('/posts', input)

  return data
}

/** Likes a post. The API is idempotent and answers 204. */
export async function likePost(postId) {
  await apiClient.post(postPath(postId, '/likes'))
}

/** Removes the like. The API is idempotent and answers 204. */
export async function unlikePost(postId) {
  await apiClient.delete(postPath(postId, '/likes'))
}

/** Lists the comments of a post; replies carry `parentId`. */
export async function listComments(postId) {
  const { data } = await apiClient.get(postPath(postId, '/comments'))

  return data
}

/** Creates a top-level comment or a reply. */
export async function createComment(postId, input) {
  const { data } = await apiClient.post(postPath(postId, '/comments'), input)

  return data
}

/** Lists the tags used by posts, with their post counts. */
export async function listTags() {
  const { data } = await apiClient.get('/tags')

  return data
}
