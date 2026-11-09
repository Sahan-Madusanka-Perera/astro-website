# 🔭 USJ Astronomy Club Website

A modern, feature-rich website for the University of Sri Jayewardenepura Astronomy Club, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Admin: boards, planets and their people

Everything on the **Board** page, the home page's planets and each **planet page** is managed from the admin panel (`/admin`).

### Setup

1. Open the Supabase dashboard → **SQL Editor** → New query, paste the contents of [`db/boards-and-planets.sql`](db/boards-and-planets.sql) and run it.
   It creates the tables and fills in the planets, the 2024/25 board photos and the 2025/26 board hierarchy.
   **Run it again whenever this file changes** — it only adds what is missing and never overwrites what you've edited in the admin.
2. That's it. The `club` storage bucket for photos is created automatically on the first upload.

Until step 1 is done the public pages keep showing the built-in content, and the admin screens say what to run.

### Day to day

- **Admin → Boards**: one entry per year.
  - **Add year** for a new committee. It copies the level names from an earlier year (or starts from the default levels), starts as a draft, and goes live when you tick **Published**. Tick **Current board** to make it the default everywhere.
  - **How this year is shown**: *Hierarchy* (current and future years) or *Group photos* (older years like 2024/25).
  - **Board hierarchy**: the levels shown top to bottom, e.g. Advisory Panel → Top Board → Planet Directors → Project Heads. Add, rename, reorder or delete levels, and add as many people to each as that year needs, each with their own **name, position and photo** (plus an optional group, extra line, email and LinkedIn). People who share a **group** — a project, for example — are shown together.
    The *Planet Directors* level fills itself from that year's planet teams, so directors are entered once.
  - **Planet teams**: for that year, each planet's directors and managers (name, photo, email, phone, LinkedIn, bio) — any number of each.
  - **Board photos** (photo-style years only): upload as many as you like, give each a title and caption, reorder, replace or remove. The first photo is the cover.
- **Admin → Planets**: rename planets, change their logo, description, responsibilities and web address, reorder them, or add and delete planets.

Public pages refresh as soon as you save. Photos that are replaced or removed are deleted from storage.

---

**Made with ❤️ and ✨ for astronomy enthusiasts**
