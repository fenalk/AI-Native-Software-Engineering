import { NestFactory } from '@nestjs/core';
import { getDrizzleToken } from '@nestjs/drizzle';
import { inArray } from 'drizzle-orm';
import { AppModule } from '../app.module.js';
import { PasswordHasherService } from '../users/password-hasher.service.js';
import type { Database } from './database.js';
import {
  comments,
  postLikes,
  posts,
  postTags,
  tags,
  users,
} from './schema.js';

/**
 * Development seed: wipes posts and tags, then recreates a small feed with
 * mocked authors, thumbnails, likes and comments.
 *
 * Run with `pnpm api db:seed` (after `db:migrate`). It is destructive: every
 * existing post and tag is removed.
 */
const DEMO_PASSWORD = 'senha-segura';

const seedUsers = [
  {
    name: 'Julio',
    email: 'julio@codeconnect.dev',
    username: 'julio',
    avatarUrl: '/seed/julio.png',
  },
  {
    name: 'Marcia',
    email: 'marcia@codeconnect.dev',
    username: 'marcia',
    avatarUrl: null,
  },
  {
    name: 'Gabriel Luz',
    email: 'gabriel@codeconnect.dev',
    username: 'gabriel_luz',
    avatarUrl: null,
  },
  {
    name: 'Marcela Lins',
    email: 'marcela@codeconnect.dev',
    username: 'marcela.lins',
    avatarUrl: null,
  },
  {
    name: 'Ada Lovelace',
    email: 'ada@codeconnect.dev',
    username: 'ada',
    avatarUrl: null,
  },
];

const seedTags = [
  { slug: 'react', name: 'React' },
  { slug: 'front-end', name: 'Front-end' },
  { slug: 'acessibilidade', name: 'Acessibilidade' },
  { slug: 'css', name: 'CSS' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'node', name: 'Node' },
  { slug: 'design', name: 'Design' },
];

const seedPosts = [
  {
    author: 'julio@codeconnect.dev',
    title: 'Design system com React e Tailwind',
    description:
      'Como organizar tokens, componentes e variantes para manter o feed consistente sem repetir classes por toda parte.',
    thumbnailUrl: '/seed/feed-01.png',
    tags: ['react', 'front-end', 'design'],
    content: `const tokens = {
  surface: 'bg-surface',
  ink: 'text-ink',
  accent: 'text-accent',
}

export function Card({ children }) {
  return (
    <article className="rounded-lg bg-surface p-4">
      {children}
    </article>
  )
}`,
  },
  {
    author: 'marcia@codeconnect.dev',
    title: 'Acessibilidade na prática',
    description:
      'Contraste, foco visível e navegação por teclado: o mínimo que todo componente do feed precisa entregar.',
    thumbnailUrl: '/seed/feed-02.png',
    tags: ['acessibilidade', 'front-end'],
    content: `export function LikeButton({ pressed, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label="Curtir post"
      onClick={onClick}
    >
      <HeartIcon aria-hidden="true" />
    </button>
  )
}`,
  },
  {
    author: 'marcela@codeconnect.dev',
    title: 'CSS moderno sem dor',
    description:
      'Grid, container queries e as propriedades que substituíram vários hacks que ainda aparecem por aí.',
    thumbnailUrl: '/seed/feed-03.png',
    tags: ['css', 'front-end'],
    content: `.feed {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

@media (max-width: 640px) {
  .feed {
    grid-template-columns: minmax(0, 1fr);
  }
}`,
  },
  {
    author: 'gabriel@codeconnect.dev',
    title: 'TypeScript para quem vem do JavaScript',
    description:
      'Os tipos que realmente ajudam no dia a dia: unions, generics simples e inferência sem exagerar na sintaxe.',
    thumbnailUrl: '/seed/feed-04.png',
    tags: ['typescript', 'front-end'],
    content: `type Post = {
  id: string
  title: string
  tags: string[]
}

function byTag(posts: Post[], tag: string): Post[] {
  return posts.filter((post) => post.tags.includes(tag))
}`,
  },
  {
    author: 'ada@codeconnect.dev',
    title: 'API em NestJS com Drizzle',
    description:
      'Um repositório injetável, migrations versionadas e testes e2e contra um banco separado.',
    thumbnailUrl: '/seed/feed-05.png',
    tags: ['node', 'typescript'],
    content: `@Injectable()
export class PostsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findById(id: string) {
    const [post] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    return post ?? null
  }
}`,
  },
  {
    author: 'julio@codeconnect.dev',
    title: 'Componentes atômicos de verdade',
    description:
      'A diferença entre um átomo e uma molécula na prática, com exemplos do card de post e do menu lateral.',
    thumbnailUrl: '/seed/feed-06.png',
    tags: ['react', 'design'],
    content: `// atoms -> molecules -> organisms -> templates -> pages
export function PostCard({ post }) {
  return (
    <article>
      <PostThumbnail src={post.thumbnailUrl} />
      <PostMeta post={post} />
      <PostActions post={post} />
    </article>
  )
}`,
  },
  {
    author: 'marcia@codeconnect.dev',
    title: 'Rascunho: ideias para o próximo projeto',
    description:
      'Um post sem thumbnail para lembrar que o placeholder também faz parte do design system.',
    thumbnailUrl: null,
    tags: ['design'],
    content: `const ideas = [
  'feed com busca full-text',
  'curtidas e comentários',
  'placeholder de thumbnail',
]`,
  },
  {
    author: 'gabriel@codeconnect.dev',
    title: 'Post com thumbnail quebrada',
    description:
      'A imagem aponta para um arquivo que não existe, então o componente precisa cair no fallback sem quebrar o layout.',
    thumbnailUrl: '/seed/nao-existe.png',
    tags: ['css'],
    content: `<img
  src="/seed/nao-existe.png"
  alt="Prévia do post"
  onError={() => setFailed(true)}
/>`,
  },
];

const seedComments = [
  {
    post: 0,
    author: 'marcia@codeconnect.dev',
    body: 'Achei muito bom seu código, @julio, parabéns!',
  },
  {
    post: 0,
    author: 'julio@codeconnect.dev',
    body: 'Valeu, Marcia! A ideia é justamente reaproveitar os átomos.',
    parent: 0,
  },
  {
    post: 0,
    author: 'gabriel@codeconnect.dev',
    body: 'Quanto tempo você levou para finalizar esse projeto?',
  },
  {
    post: 1,
    author: 'marcela@codeconnect.dev',
    body: 'Espero chegar um dia nesse nível! Muito bom!',
  },
  {
    post: 1,
    author: 'julio@codeconnect.dev',
    body: 'Poxa, obrigado Marcela! Se precisar de ajuda é só chamar.',
    parent: 3,
  },
  {
    post: 2,
    author: 'julio@codeconnect.dev',
    body: 'Esse grid salvou o layout do feed.',
  },
  {
    post: 3,
    author: 'ada@codeconnect.dev',
    body: 'A parte de unions foi a que mais me ajudou.',
  },
  {
    post: 4,
    author: 'gabriel@codeconnect.dev',
    body: 'Testar contra o banco de teste faz muita diferença.',
  },
];

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const db = app.get<Database>(getDrizzleToken());
    const passwordHasher = app.get(PasswordHasherService);
    const passwordHash = await passwordHasher.hash(DEMO_PASSWORD);

    // Users are upserted so re-running the seed keeps the demo credentials.
    for (const user of seedUsers) {
      await db
        .insert(users)
        .values({ ...user, passwordHash })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            passwordHash,
          },
        });
    }

    // Destructive: comments, likes and post_tags cascade from posts.
    await db.delete(posts);
    await db.delete(tags);

    const userRows = await db
      .select()
      .from(users)
      .where(
        inArray(
          users.email,
          seedUsers.map((user) => user.email),
        ),
      );
    const usersByEmail = new Map(userRows.map((user) => [user.email, user]));

    const tagRows = await db.insert(tags).values(seedTags).returning();
    const tagsBySlug = new Map(tagRows.map((tag) => [tag.slug, tag]));

    const postRows: { id: string }[] = [];

    for (const [index, post] of seedPosts.entries()) {
      const author = usersByEmail.get(post.author);
      if (!author) {
        throw new Error(`Seed author not found: ${post.author}`);
      }

      const [created] = await db
        .insert(posts)
        .values({
          authorId: author.id,
          title: post.title,
          description: post.description,
          content: post.content,
          thumbnailUrl: post.thumbnailUrl,
          createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
        })
        .returning({ id: posts.id });

      postRows.push(created);

      const tagLinks = post.tags
        .map((slug) => tagsBySlug.get(slug))
        .filter((tag) => tag !== undefined)
        .map((tag) => ({ postId: created.id, tagId: tag.id }));

      if (tagLinks.length > 0) {
        await db.insert(postTags).values(tagLinks);
      }

      // A few likes per post, rotating through the seeded users.
      const likeUsers = userRows.slice(0, 2 + (index % 4));
      await db
        .insert(postLikes)
        .values(
          likeUsers.map((user) => ({ postId: created.id, userId: user.id })),
        )
        .onConflictDoNothing();
    }

    const commentRows: { id: string }[] = [];

    for (const comment of seedComments) {
      const author = usersByEmail.get(comment.author);
      const post = postRows[comment.post];
      if (!author || !post) {
        continue;
      }

      const [created] = await db
        .insert(comments)
        .values({
          postId: post.id,
          authorId: author.id,
          body: comment.body,
          parentId:
            comment.parent === undefined
              ? null
              : (commentRows[comment.parent]?.id ?? null),
        })
        .returning({ id: comments.id });

      commentRows.push(created);
    }

    console.log(
      `Seed ready: ${seedUsers.length} users, ${seedPosts.length} posts, ${seedComments.length} comments.`,
    );
    console.log(`Demo login: ada@codeconnect.dev / ${DEMO_PASSWORD}`);
  } finally {
    await app.close();
  }
}

await seed();
