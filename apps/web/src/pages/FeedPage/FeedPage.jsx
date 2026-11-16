import { useEffect, useState } from 'react'
import { Button } from '../../components/atoms/Button/Button.jsx'
import { FilterBar } from '../../components/molecules/FilterBar/FilterBar.jsx'
import { SearchField } from '../../components/molecules/SearchField/SearchField.jsx'
import { PostGrid } from '../../components/organisms/PostGrid/PostGrid.jsx'
import { AppTemplate } from '../../components/templates/AppTemplate/AppTemplate.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import {
  likePost,
  listPosts,
  listTags,
  unlikePost,
} from '../../services/posts-service.js'
import { toProblemDetails } from '../../services/problem-details.js'
import { useSession } from '../../session/session-context.js'

const PAGE_SIZE = 12

const defaultNavigate = (path) => window.location.assign(path)

function Tab({ active, children, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'rounded px-1 text-xl leading-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        active
          ? 'font-semibold text-accent underline'
          : 'text-muted hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function FeedPage({ navigate = defaultNavigate }) {
  const { isAuthenticated } = useSession()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [sort, setSort] = useState('recent')
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  // Loading and errors are derived from the request they belong to, instead
  // of flags toggled by each handler: the feed is loading until the response
  // for the current search/tags/sort arrives, and an error only shows while
  // its request is still the current one. A search that returns to the same
  // debounced value therefore never leaves the feed stuck on "loading".
  const requestKey = JSON.stringify([debouncedSearch, selectedTags, sort])
  const [loadedKey, setLoadedKey] = useState(null)
  const [failure, setFailure] = useState(null)
  const loading = loadedKey !== requestKey
  const error = failure?.key === requestKey ? failure.message : null

  function fail(requestError) {
    setFailure({
      key: requestKey,
      message: toProblemDetails(requestError).detail,
    })
  }

  useEffect(() => {
    let active = true

    listTags()
      .then((tags) => {
        if (active) {
          setAvailableTags(tags)
        }
      })
      .catch(() => {
        if (active) {
          setAvailableTags([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    listPosts({
      search: debouncedSearch,
      tags: selectedTags,
      sort,
      page: 1,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (!active) {
          return
        }

        setPosts(data.items)
        setTotal(data.total)
        setPage(1)
        setFailure(null)
        setLoadedKey(requestKey)
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        setFailure({
          key: requestKey,
          message: toProblemDetails(requestError).detail,
        })
        setPosts([])
        setTotal(0)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, selectedTags, sort, requestKey])

  function toggleTag(slug) {
    setSelectedTags((current) =>
      current.includes(slug)
        ? current.filter((tag) => tag !== slug)
        : [...current, slug],
    )
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    setFailure(null)

    try {
      const nextPage = page + 1
      const data = await listPosts({
        search: debouncedSearch,
        tags: selectedTags,
        sort,
        page: nextPage,
        limit: PAGE_SIZE,
      })

      setPosts((current) => [...current, ...data.items])
      setTotal(data.total)
      setPage(nextPage)
    } catch (requestError) {
      fail(requestError)
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleLike(post) {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const willLike = !post.likedByMe

    setPosts((current) =>
      current.map((candidate) =>
        candidate.id === post.id
          ? {
              ...candidate,
              likedByMe: willLike,
              likesCount: Math.max(
                0,
                candidate.likesCount + (willLike ? 1 : -1),
              ),
            }
          : candidate,
      ),
    )

    try {
      await (willLike ? likePost(post.id) : unlikePost(post.id))
    } catch (requestError) {
      setPosts((current) =>
        current.map((candidate) =>
          candidate.id === post.id
            ? {
                ...candidate,
                likedByMe: post.likedByMe,
                likesCount: post.likesCount,
              }
            : candidate,
        ),
      )

      if (toProblemDetails(requestError).status === 401) {
        navigate('/login')
        return
      }

      fail(requestError)
    }
  }

  return (
    <AppTemplate active="feed">
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4" aria-label="Busca e filtros">
          <SearchField value={search} onChange={setSearch} />
          <FilterBar
            tags={availableTags}
            selected={selectedTags}
            onToggle={toggleTag}
            onClear={() => setSelectedTags([])}
          />
        </section>

        <section className="flex flex-col gap-8" aria-label="Posts">
          <div
            role="tablist"
            aria-label="Ordenar posts"
            className="flex items-center justify-center gap-6"
          >
            <Tab active={sort === 'recent'} onClick={() => setSort('recent')}>
              Recentes
            </Tab>
            <Tab active={sort === 'popular'} onClick={() => setSort('popular')}>
              Mais curtidos
            </Tab>
          </div>

          {error ? (
            <p role="alert" className="m-0 text-sm leading-normal text-danger">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p role="status" className="m-0 text-xl leading-normal text-ink">
              Carregando posts...
            </p>
          ) : null}

          {!loading && !error && posts.length === 0 ? (
            <p className="m-0 text-xl leading-normal text-muted">
              Nenhum post encontrado. Tente outra busca ou remova os filtros.
            </p>
          ) : null}

          {!loading && posts.length > 0 ? (
            <PostGrid posts={posts} onLike={handleLike} />
          ) : null}

          {!loading && posts.length < total ? (
            <div className="flex justify-center">
              <Button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </AppTemplate>
  )
}
