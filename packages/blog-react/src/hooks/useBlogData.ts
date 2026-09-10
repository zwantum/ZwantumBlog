import { useState, useEffect, useCallback } from 'react';
import { Post, PostFilterInput, PaginationParams, PaginatedResult, Category, Tag } from '@zwantum/blog-types';
import { useBlog } from '../context/BlogProvider';

export function useBlogPost(slugOrId: string) {
  const blog = useBlog();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPost = useCallback(async () => {
    if (!slugOrId) return;
    setLoading(true);
    setError(null);
    try {
      // Try slug first, then fallback to id
      let data = await blog.posts.getBySlug(slugOrId);
      if (!data) {
        data = await blog.posts.getById(slugOrId);
      }
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [blog, slugOrId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost };
}

export function useBlogPosts(filters?: PostFilterInput & PaginationParams) {
  const blog = useBlog();
  const [data, setData] = useState<PaginatedResult<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await blog.posts.list({
        status: 'published',
        ...filters,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [blog, JSON.stringify(filters)]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts: data?.data || [],
    pagination: data,
    loading,
    error,
    refetch: fetchPosts,
  };
}

export function useFeaturedPosts(limit: number = 5) {
  const blog = useBlog();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    blog.posts
      .getFeatured(limit)
      .then((data) => {
        if (isMounted) setPosts(data);
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [blog, limit]);

  return { posts, loading, error };
}

export function useRelatedPosts(postId: string, limit: number = 3) {
  const blog = useBlog();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    let isMounted = true;
    setLoading(true);
    blog.posts
      .getRelated(postId, limit)
      .then((data) => {
        if (isMounted) setPosts(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [blog, postId, limit]);

  return { posts, loading };
}

export function useCategories() {
  const blog = useBlog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    blog.categories
      .getAll()
      .then((cats) => {
        if (isMounted) setCategories(cats);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [blog]);

  return { categories, loading };
}

export function useTags() {
  const blog = useBlog();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    blog.tags
      .getAll()
      .then((t) => {
        if (isMounted) setTags(t);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [blog]);

  return { tags, loading };
}
