import { Post, SEOHealthReport, SEOHealthCheckItem } from '@zwantum/blog-types';

export function evaluateSEOHealth(post: Partial<Post>): SEOHealthReport {
  const checks: SEOHealthCheckItem[] = [];

  const title = post.seo?.meta_title || post.title || '';
  const desc = post.seo?.meta_description || post.excerpt || '';
  const focusKeyword = post.seo?.focus_keyword?.toLowerCase().trim() || '';

  // 1. Meta Title Presence & Length
  if (!title.trim()) {
    checks.push({
      id: 'title_missing',
      label: 'SEO Title',
      passed: false,
      type: 'error',
      message: 'Title is missing. A descriptive title is essential for search engines.',
    });
  } else if (title.length < 30) {
    checks.push({
      id: 'title_short',
      label: 'SEO Title Length',
      passed: false,
      type: 'warning',
      message: `Title is relatively short (${title.length} chars). 40–60 characters is recommended.`,
    });
  } else if (title.length > 70) {
    checks.push({
      id: 'title_long',
      label: 'SEO Title Length',
      passed: false,
      type: 'warning',
      message: `Title is long (${title.length} chars) and may be truncated on search results pages.`,
    });
  } else {
    checks.push({
      id: 'title_optimal',
      label: 'SEO Title Length',
      passed: true,
      type: 'success',
      message: `Title length is optimal (${title.length} chars).`,
    });
  }

  // 2. Meta Description Presence & Length
  if (!desc.trim()) {
    checks.push({
      id: 'desc_missing',
      label: 'Meta Description',
      passed: false,
      type: 'warning',
      message: 'Meta description is missing. Search engines will automatically pick snippet text.',
    });
  } else if (desc.length < 70) {
    checks.push({
      id: 'desc_short',
      label: 'Meta Description Length',
      passed: false,
      type: 'warning',
      message: `Meta description is short (${desc.length} chars). 120–160 characters recommended.`,
    });
  } else if (desc.length > 170) {
    checks.push({
      id: 'desc_long',
      label: 'Meta Description Length',
      passed: false,
      type: 'warning',
      message: `Meta description is long (${desc.length} chars) and may be truncated in search snippets.`,
    });
  } else {
    checks.push({
      id: 'desc_optimal',
      label: 'Meta Description Length',
      passed: true,
      type: 'success',
      message: `Meta description length is optimal (${desc.length} chars).`,
    });
  }

  // 3. Slug Validation
  const slug = post.slug || '';
  if (!slug.trim()) {
    checks.push({
      id: 'slug_missing',
      label: 'URL Slug',
      passed: false,
      type: 'error',
      message: 'Post slug is missing.',
    });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    checks.push({
      id: 'slug_format',
      label: 'URL Slug Format',
      passed: false,
      type: 'warning',
      message: 'Slug should contain only lowercase letters, numbers, and hyphens.',
    });
  } else {
    checks.push({
      id: 'slug_valid',
      label: 'URL Slug',
      passed: true,
      type: 'success',
      message: 'URL slug is clean and search-engine friendly.',
    });
  }

  // 4. Focus Keyword Coverage (if specified)
  if (focusKeyword) {
    const inTitle = title.toLowerCase().includes(focusKeyword);
    const inDesc = desc.toLowerCase().includes(focusKeyword);

    if (inTitle) {
      checks.push({
        id: 'keyword_title',
        label: 'Focus Keyword in Title',
        passed: true,
        type: 'success',
        message: `Focus keyword "${focusKeyword}" appears in the title.`,
      });
    } else {
      checks.push({
        id: 'keyword_title_missing',
        label: 'Focus Keyword in Title',
        passed: false,
        type: 'warning',
        message: `Focus keyword "${focusKeyword}" is not found in the title.`,
      });
    }

    if (inDesc) {
      checks.push({
        id: 'keyword_desc',
        label: 'Focus Keyword in Description',
        passed: true,
        type: 'success',
        message: `Focus keyword "${focusKeyword}" appears in the meta description.`,
      });
    } else {
      checks.push({
        id: 'keyword_desc_missing',
        label: 'Focus Keyword in Description',
        passed: false,
        type: 'warning',
        message: `Focus keyword "${focusKeyword}" is not found in the meta description.`,
      });
    }
  }

  // 5. Featured Image & Alt Text
  if (!post.featured_image_id && !post.featured_image && !post.seo?.og_image_url) {
    checks.push({
      id: 'featured_image_missing',
      label: 'Featured Image',
      passed: false,
      type: 'warning',
      message: 'No featured image set. Articles with visual imagery attract significantly higher social clicks.',
    });
  } else {
    const alt = post.featured_image?.alt_text?.trim();
    if (alt) {
      checks.push({
        id: 'featured_image_alt',
        label: 'Image Alt Text',
        passed: true,
        type: 'success',
        message: 'Featured image contains descriptive accessibility alt text.',
      });
    } else {
      checks.push({
        id: 'featured_image_alt_missing',
        label: 'Image Alt Text',
        passed: false,
        type: 'warning',
        message: 'Featured image is missing alt text. Providing alt text improves accessibility and image SEO.',
      });
    }
  }

  // 6. Author Assigned
  if (post.author_id || post.author) {
    checks.push({
      id: 'author_assigned',
      label: 'Content Author',
      passed: true,
      type: 'success',
      message: 'Author is assigned (E-E-A-T trust signal).',
    });
  } else {
    checks.push({
      id: 'author_missing',
      label: 'Content Author',
      passed: false,
      type: 'warning',
      message: 'No author assigned. Google E-E-A-T guidelines favor clear authorship.',
    });
  }

  // 7. Content Depth (Word Count)
  const wordCount = post.word_count || 0;
  if (wordCount < 100) {
    checks.push({
      id: 'content_thin',
      label: 'Content Length',
      passed: false,
      type: 'warning',
      message: `Content is short (${wordCount} words). Comprehensive articles usually contain 300+ words.`,
    });
  } else {
    checks.push({
      id: 'content_adequate',
      label: 'Content Length',
      passed: true,
      type: 'success',
      message: `Article has good content depth (${wordCount} words).`,
    });
  }

  // 8. Canonical URL
  if (post.seo?.canonical_url) {
    checks.push({
      id: 'canonical_custom',
      label: 'Canonical URL',
      passed: true,
      type: 'success',
      message: 'Custom canonical URL is defined.',
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const warningCount = checks.filter((c) => c.type === 'warning').length;
  const errorCount = checks.filter((c) => c.type === 'error').length;

  const score = Math.max(0, Math.min(100, Math.round((passedCount / checks.length) * 100)));

  return {
    score,
    passedCount,
    warningCount,
    errorCount,
    checks,
  };
}
