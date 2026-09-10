import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Author, AuthorInput, AuthorSEO, AuthorSocialLinks } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface AuthorManagerProps {
  client: BlogClient;
  className?: string;
}

export const AuthorManager: React.FC<AuthorManagerProps> = ({ client, className = '' }) => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'seo'>('details');

  // Form State: Details
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  // Form State: SEO & Open Graph
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [noIndex, setNoIndex] = useState(false);

  // Form State: Social Links (E-E-A-T & Schema.org sameAs)
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ogFileInputRef = useRef<HTMLInputElement>(null);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError('');
      return true;
    }
    // Strict RFC-compliant email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid email address (e.g. name@example.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.authors.getAll();
      setAuthors(res);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const openCreateModal = () => {
    setEditingAuthor(null);
    setName('');
    setSlug('');
    setIsSlugManuallyEdited(false);
    setDesignation('');
    setEmail('');
    setEmailError('');
    setBio('');
    setProfileImageUrl('');

    // SEO defaults
    setMetaTitle('');
    setMetaDescription('');
    setCanonicalUrl('');
    setOgTitle('');
    setOgDescription('');
    setOgImageUrl('');
    setNoIndex(false);

    // Social defaults
    setWebsite('');
    setTwitter('');
    setLinkedin('');
    setGithub('');

    setActiveModalTab('details');
    setIsModalOpen(true);
  };

  const openEditModal = (author: Author) => {
    setEditingAuthor(author);
    setName(author.name);
    setSlug(author.slug);
    setIsSlugManuallyEdited(true);
    setDesignation(author.designation || '');
    setEmail(author.email || '');
    setEmailError('');
    setBio(author.bio || '');
    setProfileImageUrl(author.profile_image_url || '');

    // SEO
    setMetaTitle(author.seo?.metaTitle || '');
    setMetaDescription(author.seo?.metaDescription || '');
    setCanonicalUrl(author.seo?.canonicalUrl || '');
    setOgTitle(author.seo?.ogTitle || '');
    setOgDescription(author.seo?.ogDescription || '');
    setOgImageUrl(author.seo?.ogImage || '');
    setNoIndex(!!author.seo?.noIndex);

    // Social Links
    setWebsite(author.social_links?.website || '');
    setTwitter(author.social_links?.twitter || '');
    setLinkedin(author.social_links?.linkedin || '');
    setGithub(author.social_links?.github || '');

    setActiveModalTab('details');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setIsSlugManuallyEdited(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setOgImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Strict Email Format Validation
    if (email.trim() && !validateEmail(email)) {
      setActiveModalTab('details');
      return;
    }

    try {
      const social_links: AuthorSocialLinks = {
        website: website.trim() || undefined,
        twitter: twitter.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        github: github.trim() || undefined,
      };

      const seo: AuthorSEO = {
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        ogTitle: ogTitle.trim() || metaTitle.trim() || undefined,
        ogDescription: ogDescription.trim() || metaDescription.trim() || undefined,
        ogImage: ogImageUrl.trim() || profileImageUrl.trim() || undefined,
        noIndex,
      };

      const input: AuthorInput = {
        name: name.trim(),
        slug: slug.trim() ? slugify(slug.trim()) : slugify(name.trim()),
        email: email.trim() || null,
        designation: designation.trim() || null,
        bio: bio.trim() || null,
        profile_image_url: profileImageUrl.trim() || null,
        social_links,
        seo,
      };

      if (editingAuthor) {
        await client.authors.update(editingAuthor.id, input);
      } else {
        await client.authors.create(input);
      }

      setIsModalOpen(false);
      fetchAuthors();
    } catch (err) {
      alert(`Error saving author: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this author?')) return;
    try {
      await client.authors.delete(id);
      fetchAuthors();
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  // Live previews for SEO
  const previewTitle = metaTitle.trim() || (name ? `${name}${designation ? ` - ${designation}` : ''} | Blog` : 'Author Profile');
  const previewDesc = metaDescription.trim() || (bio.trim() ? bio.slice(0, 150) : `Read articles and insights published by ${name || 'the author'} on our blog.`);
  const previewSlug = slug || slugify(name) || 'author-slug';
  const previewOgImage = ogImageUrl || profileImageUrl;

  return (
    <div className={`zw-admin-container ${className}`} style={{ width: '100%', margin: 0 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Authors
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
            Manage editorial contributors, bios, designations, and author SEO profiles.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            background: '#ffcc00',
            color: '#0f172a',
            border: 'none',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Author</span>
        </button>
      </div>

      {/* Authors Table Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '12px' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Author</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Designation / Role</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Slug & SEO</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading authors...
                  </td>
                </tr>
              ) : authors.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No authors created yet.
                  </td>
                </tr>
              ) : (
                authors.map((auth) => (
                  <tr key={auth.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {auth.profile_image_url ? (
                          <img
                            src={auth.profile_image_url}
                            alt={auth.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #f1f5f9' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              color: '#0f172a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          >
                            {auth.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{auth.name}</div>
                          {auth.bio && (
                            <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {auth.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{auth.designation || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{auth.email || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace' }}>/{auth.slug}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: auth.seo?.metaTitle ? '#dcfce7' : '#f1f5f9', color: auth.seo?.metaTitle ? '#166534' : '#64748b' }}>
                          {auth.seo?.metaTitle ? 'SEO Configured' : 'Default SEO'}
                        </span>
                        {auth.seo?.ogImage && (
                          <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca' }}>
                            OG Banner
                          </span>
                        )}
                        {auth.social_links?.linkedin && (
                          <span style={{ fontSize: '10.5px', color: '#2563eb' }}>LinkedIn</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(auth)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: '#fffdf0',
                            border: '1px solid #fef08a',
                            color: '#ca8a04',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(auth.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
                {editingAuthor ? 'Edit Author' : 'Add Author'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs: Details vs SEO & Social */}
            <div style={{ display: 'flex', gap: '8px', padding: '0 24px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              <button
                type="button"
                onClick={() => setActiveModalTab('details')}
                style={{
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontWeight: activeModalTab === 'details' ? 600 : 400,
                  color: activeModalTab === 'details' ? '#0f172a' : '#64748b',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeModalTab === 'details' ? '2.5px solid #ffcc00' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>👤 Profile Details</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('seo')}
                style={{
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontWeight: activeModalTab === 'seo' ? 600 : 400,
                  color: activeModalTab === 'seo' ? '#0f172a' : '#64748b',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeModalTab === 'seo' ? '2.5px solid #ffcc00' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🌐 SEO & Open Graph</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {activeModalTab === 'details' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Aarav Sharma"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Slug (Clean label without auto-generate text) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Slug
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
                          /author/
                        </span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="dr-aarav-sharma"
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 72px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13.5px',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Designation / Role */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chief Editorial Consultant"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Email with Strict Format Validation */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="aarav@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) validateEmail(e.target.value);
                        }}
                        onBlur={(e) => validateEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: emailError ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {emailError && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 500 }}>
                          {emailError}
                        </div>
                      )}
                    </div>

                    {/* Profile Image (Device Upload + URL) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Profile Image
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        {/* Live Avatar Preview */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt="Avatar Preview"
                              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffcc00' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: '#fef3c7',
                                color: '#b45309',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '18px',
                              }}
                            >
                              {name ? name.slice(0, 2).toUpperCase() : 'AU'}
                            </div>
                          )}
                        </div>

                        {/* Upload & URL Controls */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                          />

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: '#0f172a',
                                fontSize: '12.5px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              <span>Upload from Device</span>
                            </button>

                            {profileImageUrl && (
                              <button
                                type="button"
                                onClick={() => setProfileImageUrl('')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  padding: '6px 8px',
                                }}
                              >
                                Remove Image
                              </button>
                            )}
                          </div>

                          {/* Or Enter URL */}
                          <input
                            type="text"
                            placeholder="Or paste image URL (e.g. https://...)"
                            value={profileImageUrl.startsWith('data:') ? '✓ Uploaded from device' : profileImageUrl}
                            onChange={(e) => setProfileImageUrl(e.target.value)}
                            disabled={profileImageUrl.startsWith('data:')}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                              background: profileImageUrl.startsWith('data:') ? '#f1f5f9' : '#ffffff',
                              color: '#475569',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Senior Vastu & Architecture Consultant with over 18 years of experience..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13.5px',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* TAB 2: SEO & OPEN GRAPH */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Informative Callout */}
                    <div style={{ padding: '12px 14px', background: '#fffdf0', border: '1px solid #fef08a', borderRadius: '8px', fontSize: '12px', color: '#854d0e', lineHeight: 1.45 }}>
                      💡 <strong>Open Graph Profile & Schema.org:</strong> Configures <code>og:type="profile"</code>, Twitter profile cards, and Google E-E-A-T Person metadata when visitors or search bots browse this author.
                    </div>

                    {/* Dedicated Open Graph Social Share Banner (Separate from personal avatar) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                        Open Graph / Social Share Image (1200 × 630 px)
                      </label>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>
                        Custom banner used when sharing this author profile on social media, distinct from the profile avatar.
                      </p>

                      <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <input
                          type="file"
                          ref={ogFileInputRef}
                          accept="image/*"
                          onChange={handleOgFileSelect}
                          style={{ display: 'none' }}
                        />

                        {/* Banner Preview */}
                        {ogImageUrl && (
                          <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                            <img src={ogImageUrl} alt="OG Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setOgImageUrl('')}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(15, 23, 42, 0.75)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => ogFileInputRef.current?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              color: '#0f172a',
                              fontSize: '12.5px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Upload OG Banner from Device</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Or paste OG image URL (https://...)"
                          value={ogImageUrl.startsWith('data:') ? '✓ Uploaded from device' : ogImageUrl}
                          onChange={(e) => setOgImageUrl(e.target.value)}
                          disabled={ogImageUrl.startsWith('data:')}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            background: ogImageUrl.startsWith('data:') ? '#f1f5f9' : '#ffffff',
                            color: '#475569',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Meta Title */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>SEO Meta / OG Title</label>
                        <span style={{ fontSize: '11.5px', color: metaTitle.length > 60 ? '#e11d48' : '#64748b' }}>
                          {metaTitle.length}/60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder={`${name || 'Author Name'} - ${designation || 'Role'} | Blog`}
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Meta Description */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>SEO Meta / OG Description</label>
                        <span style={{ fontSize: '11.5px', color: metaDescription.length > 160 ? '#e11d48' : '#64748b' }}>
                          {metaDescription.length}/160 chars
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder={bio.slice(0, 155) || 'Read all articles and expert editorial pieces written by this author.'}
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                        Canonical URL Override
                      </label>
                      <input
                        type="url"
                        placeholder={`https://yourdomain.com/author/${previewSlug}`}
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Social Profiles (feeds Schema.org sameAs and Open Graph) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                        Social Profiles (Schema.org sameAs & E-E-A-T)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input
                          type="url"
                          placeholder="Website (https://...)"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', outline: 'none' }}
                        />
                        <input
                          type="text"
                          placeholder="Twitter / X (@handle or URL)"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', outline: 'none' }}
                        />
                        <input
                          type="url"
                          placeholder="LinkedIn URL"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', outline: 'none' }}
                        />
                        <input
                          type="url"
                          placeholder="GitHub URL"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    {/* SERP Search Preview Card */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Google Search Preview
                      </label>
                      <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', color: '#1a0dab', textDecoration: 'underline', fontWeight: 500, marginBottom: '2px' }}>
                          {previewTitle}
                        </div>
                        <div style={{ fontSize: '11px', color: '#006621', marginBottom: '4px' }}>
                          https://yourdomain.com/author/{previewSlug}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4d5156', lineHeight: 1.4 }}>
                          {previewDesc}
                        </div>
                      </div>
                    </div>

                    {/* Social Open Graph Landscape Preview Card */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Social / Open Graph Preview (Twitter, LinkedIn, Slack)
                      </label>
                      <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#ffffff' }}>
                        {previewOgImage ? (
                          <div style={{ height: '140px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                            <img
                              src={previewOgImage}
                              alt="OG Banner"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {ogImageUrl && profileImageUrl && (
                              <img
                                src={profileImageUrl}
                                alt={name}
                                style={{
                                  position: 'absolute',
                                  bottom: '10px',
                                  left: '12px',
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  border: '2px solid #ffffff',
                                  objectFit: 'cover',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div style={{ height: '90px', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', fontSize: '12.5px', fontWeight: 500 }}>
                            Upload an Open Graph Banner above to customize social share cards
                          </div>
                        )}
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                            yourdomain.com • AUTHOR PROFILE
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>
                            {ogTitle.trim() || previewTitle}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.35 }}>
                            {ogDescription.trim() || previewDesc}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Robots NoIndex */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                      <input
                        type="checkbox"
                        id="noIndexCheck"
                        checked={noIndex}
                        onChange={(e) => setNoIndex(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="noIndexCheck" style={{ fontSize: '12.5px', color: '#475569', cursor: 'pointer' }}>
                        Do not index this author profile in search engines (<code>noindex,nofollow</code>)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  background: '#ffffff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    background: '#ffcc00',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Save Author
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
