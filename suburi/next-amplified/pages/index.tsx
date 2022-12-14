import { Amplify, API, Auth, withSSRContext } from 'aws-amplify';
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql'
import awsExports from '../src/aws-exports';
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React from 'react';
import { listPosts } from '../src/graphql/queries';
import { createPost } from '../src/graphql/mutations';
import { CreatePostMutation } from '../src/API';
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';


Amplify.configure({ ...awsExports, ssr: true });

interface Post {
  id: string;
  message: string;
}

export const getServerSideProps: getServerSideProps = async ({ req }) => {
  const SSR = withSSRContext({ req });
  const response = await SSR.API.graphql({ query: listPosts });

  return {
    props: {
      posts: response.data.listPosts.items,
    },
  };
}

const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);

  try {
    const result = await API.graphql({
      authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
      query: createPost,
      variables: {
        input: {
          message: form.get("message"),
        },
      },
    });
    if ("data" in result && result.data){
      const data = result.data as CreatePostMutation
      window.location.href = `/posts/${data.createPost!.id}`;
    }
  } catch ({ errors }) {
    console.error(...errors);
    throw new Error(errors[0].message);
  }
}

const Home = ({ posts = [] }: { posts: Post[] }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Amplify + Next.js</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AmplifyAuthenticator>
        <main className={styles.main}>
          <h1 className={styles.title}>メッセージを送ってみる</h1>

          <p className={styles.description}>
            <code className={styles.code}>{posts.length}</code>
            posts
          </p>

          <p className={styles.grid}>
            {posts.map((post) => (
              <a className={styles.card} href={`/posts/${post.id}`} key={post.id}>
                <p>{post.message}</p>
              </a>
            ))}

            <div className={styles.card}>
              <h3 className={styles.title}>投稿する</h3>

              <form onSubmit={handleCreatePost}>
                <fieldset>
                  <legend>メッセージ</legend>
                  <textarea
                    defaultValue="Amplify + Next.js + Typescriptでアプリつくってみた!"
                    name="message"
                  />
                </fieldset>

                <fieldset>
                  <legend>Content</legend>
                  <textarea
                    defaultValue="I built an Amplify project with Next.js!"
                    name="content"
                  />
                </fieldset>

                <button>投稿する</button>
                <button onClick={() => Auth.signOut()}>サインアウト</button>
              </form>
            </div>
          </p>
        </main>
      </AmplifyAuthenticator>
      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
