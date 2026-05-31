# Funxons Blog CMS — Admin User Guide

## Overview
The Blog Posts section in your Funcxon Admin Dashboard lets you create, edit, and manage blog content exactly like HubSpot or WordPress. Posts you publish here will automatically appear in the mobile app in the areas you choose.

---

## How to Access
1. Log in to your admin dashboard at `https://your-admin-url.com`
2. In the left sidebar, click **Blog Posts** under Management

---

## The Blog Listing Page
When you open Blog Posts, you see:

- **Stats cards** at the top: Total Posts, Published, Drafts, Total Views
- **Search bar** — find posts by title, slug, category, or author
- **Status filter tabs** — All / Published / Draft / Archived
- **Posts table** with:
  - Preview button (eye icon) — see how the post looks before publishing
  - Edit button (pencil icon) — open the editor
  - Delete button (trash icon) — permanently remove a post

---

## Creating a New Post
Click the **New Post** button in the top right.

### Left Column — Content

#### Post Details
- **Title** — the headline of your blog post (required)
- **Slug** — the URL-friendly name, auto-generated from the title (e.g. `top-10-venue-tips`)
- **Excerpt** — a short summary shown in preview cards and for SEO

#### Content Editor
- A full text area with a formatting toolbar
- Supports **Markdown** formatting:
  - **Bold**, *Italic*
  - Links `[text](url)`
  - Images `![alt](url)`
  - Bullet and numbered lists
- Estimated read time is calculated automatically

#### Media
- **Video URL** — paste a YouTube, Vimeo, or direct video link
- **Media Gallery** — upload multiple images that appear inline in the post

### Right Column — Settings

#### Publishing
- **Status** — Draft, Published, or Archived
- **Publish Date** — schedule when the post goes live
- **Audience** — All Users, Vendors, Attendees, or Premium only

#### Images
- **Cover Image** — the large hero image at the top of the post
- **Featured Image** — the thumbnail used in listings and cards

Both images are uploaded directly to Supabase Storage and served via CDN.

#### Taxonomy
- **Category** — e.g. Planning, Venues, Catering, Weddings
- **Tags** — type a tag and press Enter. Click the X to remove a tag.

#### Author
- **Author Name** — defaults to "Funxons Team"
- **Author Avatar URL** — optional profile picture URL

#### Internal Linking
A list of all your other blog posts. Check the boxes to link them as "related posts" — this helps readers discover more content and improves SEO.

#### SEO
- **Meta Title** — the `<title>` tag shown in Google search results
- **Meta Description** — the snippet shown under your link in Google

#### Mobile App Display
This is the most important section for mobile visibility. Check the boxes where you want this post to appear in the app:

| Area | Where it shows |
|------|---------------|
| **Home Feed** | Main home screen scrollable feed |
| **Explore** | Discovery / browse section |
| **Vendor Detail** | Embedded on vendor profile pages |
| **Event Planning** | Inside the planning tools area |
| **User Profile** | On user profile pages |
| **Blog Section** | Dedicated blog / articles tab |

> **Tip:** You can select multiple areas. For example, a "Top 10 Wedding Venues" post could appear on Home Feed, Explore, and the Blog Section.

---

## Editing an Existing Post
1. On the Blog Posts listing page, click the **pencil icon** on any row
2. Make your changes in the editor
3. Click **Save Draft** or **Publish**

---

## Publishing Workflow

| Action | What happens |
|--------|-------------|
| **Save Draft** | Saves the post but keeps it invisible to users |
| **Publish** | Sets status to Published, makes it live, records the publish date |
| **Archive** | Keeps the post but hides it from all app areas (useful for seasonal content) |
| **Delete** | Permanently removes the post and all its data |

---

## Image & Video Best Practices
- **Cover Image:** 1200 x 630px (landscape) for best social sharing
- **Featured Image:** 800 x 600px
- **Gallery Images:** Any size, will be displayed in a responsive grid
- **Video:** Paste a YouTube `watch?v=...` link, Vimeo link, or a direct `.mp4` URL

---

## Mobile App Visibility Checklist
Before publishing, verify:
- [ ] At least one **Mobile App Display Area** is checked
- [ ] **Cover Image** is uploaded (looks best in the app)
- [ ] **Excerpt** is written (used in app cards)
- [ ] **Category** is set (used for app filtering)
- [ ] **Status** is set to Published

---

## Quick Reference

| Task | How to do it |
|------|-------------|
| Create post | Blog Posts → New Post → fill fields → Publish |
| Edit post | Blog Posts → click pencil icon on any row |
| Preview post | Blog Posts → click eye icon on any row |
| Add images to post | Upload Cover Image, Featured Image, or use Media Gallery |
| Add a video | Paste URL in the Video URL field |
| Link to another post | In Internal Linking, check the related posts |
| Schedule a post | Set Publish Date to a future date and click Publish |
| Control where post shows in app | Check the Mobile App Display Areas you want |
| Improve Google ranking | Fill Meta Title and Meta Description in the SEO section |

---

## Need Help?
Contact your development team if you see:
- Upload errors (images not saving)
- Posts not appearing in the app after publishing
- Any broken links or formatting issues
