import React, { createContext, useContext, useMemo } from 'react';
import { BlogClient, createBlogClient, BlogClientOptions } from '@zwantum/blog-core';

interface BlogContextValue {
  client: BlogClient;
}

const BlogContext = createContext<BlogContextValue | null>(null);

export interface BlogProviderProps {
  client?: BlogClient;
  options?: BlogClientOptions;
  children: React.ReactNode;
}

export const BlogProvider: React.FC<BlogProviderProps> = ({ client, options, children }) => {
  const blogClient = useMemo(() => {
    if (client) return client;
    return createBlogClient(options);
  }, [client, options]);

  return <BlogContext.Provider value={{ client: blogClient }}>{children}</BlogContext.Provider>;
};

export function useBlog(): BlogClient {
  const ctx = useContext(BlogContext);
  if (!ctx) {
    throw new Error('useBlog must be used within a <BlogProvider>');
  }
  return ctx.client;
}
