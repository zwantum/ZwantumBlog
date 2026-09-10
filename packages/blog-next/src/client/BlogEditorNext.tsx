import React, { useState, useEffect } from 'react';
import { BlogEditor, BlogEditorProps } from '@zwantum/blog-editor';

export const BlogEditorNext: React.FC<BlogEditorProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#94a3b8',
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span>Loading Blog Editor...</span>
      </div>
    );
  }

  return <BlogEditor {...props} />;
};
