import { PostThumbnail } from '../../atoms/PostThumbnail/PostThumbnail.jsx'
import { Tag } from '../../atoms/Tag/Tag.jsx'
import { PostActions } from '../../molecules/PostActions/PostActions.jsx'

/**
 * Post summary shared by the feed and the detail page. The `detail` variant
 * only changes sizes (thumbnail and title), keeping both pages consistent.
 */
export function PostCard({ post, variant = 'feed', onLike }) {
  const isDetail = variant === 'detail'
  const titleClasses = isDetail
    ? 'text-xl font-semibold'
    : 'text-lg font-semibold'
  const postHref = `/posts/${post.id}`

  return (
    <article className="flex flex-col overflow-hidden rounded-lg">
      {isDetail ? (
        <PostThumbnail
          src={post.thumbnailUrl}
          alt={`Prévia do post ${post.title}`}
          variant={variant}
        />
      ) : (
        <a
          href={postHref}
          className="block focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus"
          aria-label={`Abrir o post ${post.title}`}
        >
          <PostThumbnail
            src={post.thumbnailUrl}
            alt={`Prévia do post ${post.title}`}
            variant={variant}
          />
        </a>
      )}

      <div className="flex flex-1 flex-col gap-4 bg-surface p-4">
        <div className="flex flex-col gap-2 text-ink-soft">
          {isDetail ? (
            <h1 className={`m-0 leading-normal text-ink-soft ${titleClasses}`}>
              {post.title}
            </h1>
          ) : (
            <h2 className={`m-0 leading-normal text-ink-soft ${titleClasses}`}>
              <a href={postHref} className="hover:text-ink">
                {post.title}
              </a>
            </h2>
          )}
          <p className="m-0 line-clamp-3 text-sm leading-normal text-ink-soft">
            {post.description}
          </p>
        </div>

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-[10px]">
            {post.tags.map((tag) => (
              <Tag key={tag.slug}>{tag.name}</Tag>
            ))}
          </div>
        ) : null}

        <div className="mt-auto">
          <PostActions post={post} onLike={onLike} />
        </div>
      </div>
    </article>
  )
}
