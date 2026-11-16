import { PostCard } from '../PostCard/PostCard.jsx'

export function PostGrid({ posts, onLike }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={onLike} />
      ))}
    </div>
  )
}
