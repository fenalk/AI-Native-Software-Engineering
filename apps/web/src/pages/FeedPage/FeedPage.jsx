import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/atoms/Button/Button.jsx'
import { FilterBar } from '../../components/molecules/FilterBar/FilterBar.jsx'
import { SearchField } from '../../components/molecules/SearchField/SearchField.jsx'
import { PostGrid } from '../../components/organisms/PostGrid/PostGrid.jsx'
import { AppTemplate } from '../../components/templates/AppTemplate/AppTemplate.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { usePostLike } from '../../hooks/usePostLike.js'
import { listPosts, listTags } from '../../services/posts-service.js'
import { toProblemDetails } from '../../services/problem-details.js'
import { useSession } from '../../session/session-context.js'

const PAGE_SIZE = 12

const defaultNavigate = (path) => window.location.assign(path)

/**
 * Only one of these is visible at a time, so a stale error can never stay on
 * screen next to a fresh attempt: `loading` covers the first page, `ready` the
 * filled grid and `empty` the "nothing matched" message.
 */
const VIEW = {
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  error: 'error',
}

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
  const [view, setView] = useState(VIEW.loading)
  const [error, setError] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  // Bumped whenever the filters change, so the request effect re-runs even when
  // two different inputs produce the same query.
  const [requestId, setRequestId] = useState(0)

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
        setError(null)
        setView(data.items.length > 0 ? VIEW.ready : VIEW.empty)
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        setError(toProblemDetails(requestError).detail)
        setPosts([])
        setTotal(0)
        setView(VIEW.error)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, selectedTags, sort, requestId])

  const applyLike = useCallback((postId, changes) => {
    setPosts((current) =>
      current.map((candidate) =>
        candidate.id === postId ? { ...candidate, ...changes } : candidate,
      ),
    )
  }, [])

  const showError = useCallback((detail) => {
    setError(detail)
    setView(VIEW.error)
  }, [])

  const handleLike = usePostLike({
    isAuthenticated,
    navigate,
    onChange: applyLike,
    onError: showError,
  })

  /** Any filter change hides the previous result and its error right away. */
  function refilter(update) {
    update()
    setView(VIEW.loading)
    setError(null)
    setRequestId((current) => current + 1)
  }

  function handleSearchChange(value) {
    setSearch(value)
  }

  function changeSort(nextSort) {
    refilter(() => setSort(nextSort))
  }

  function toggleTag(slug) {
    refilter(() =>
      setSelectedTags((current) =>
        current.includes(slug)
          ? current.filter((tag) => tag !== slug)
          : [...current, slug],
      ),
    )
  }

  function clearFilters() {
    refilter(() => {
      setSelectedTags([])
      setSearch('')
    })
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    setError(null)

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
      setError(toProblemDetails(requestError).detail)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <AppTemplate active="feed">
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4" aria-label="Busca e filtros">
          <SearchField value={search} onChange={handleSearchChange} />
          <FilterBar
            tags={availableTags}
            selected={selectedTags}
            onToggle={toggleTag}
            onClear={clearFilters}
          />
        </section>

        <section className="flex flex-col gap-8" aria-label="Posts">
          <div
            role="tablist"
            aria-label="Ordenar posts"
            className="flex items-center justify-center gap-6"
          >
            <Tab active={sort === 'recent'} onClick={() => changeSort('recent')}>
              Recentes
            </Tab>
            <Tab active={sort === 'popular'} onClick={() => changeSort('popular')}>
              Mais curtidos
            </Tab>
          </div>

          {view === VIEW.loading ? (
            <p role="status" className="m-0 text-xl leading-normal text-ink">
              Carregando posts...
            </p>
          ) : null}

          {view === VIEW.error && error ? (
            <p role="alert" className="m-0 text-sm leading-normal text-danger">
              {error}
            </p>
          ) : null}

          {view === VIEW.empty ? (
            <p className="m-0 text-xl leading-normal text-muted">
              Nenhum post encontrado. Tente outra busca ou remova os filtros.
            </p>
          ) : null}

          {view === VIEW.ready ? (
            <>
              <PostGrid posts={posts} onLike={handleLike} />

              {posts.length < total ? (
                <div className="flex justify-center">
                  <Button onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? 'Carregando...' : 'Carregar mais'}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </AppTemplate>
  )
}
