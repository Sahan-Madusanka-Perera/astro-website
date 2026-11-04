# 🔭 USJ Astronomy Club Website

A modern, feature-rich website for the University of Sri Jayewardenepura Astronomy Club, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Admin: boards, planets and their people

Everything on the **Board** page, the home page's planets and each **planet page** is managed from the admin panel (`/admin`).

### One-time setup

1. Open the Supabase dashboard → **SQL Editor** → New query, paste the contents of [`db/boards-and-planets.sql`](db/boards-and-planets.sql) and run it.
   This creates the tables and fills them with the boards, planets and people that used to be hard-coded. It is safe to run again.
2. That's it. The `club` storage bucket for photos is created automatically on the first upload.

Until step 1 is done the public pages keep showing the built-in content, and the admin screens say what to run.

### Day to day

- **Admin → Boards**: one entry per year.
  - **Add year** for a new committee. New years start as drafts; tick **Published** when ready and **Current board** to make it the default everywhere.
  - **Board photos**: upload as many as you like (drag and drop or select several at once), give each a title and caption, reorder, replace or remove. The first photo is the cover. Large phone/camera photos are resized automatically.
  - **Planet teams**: for that year, add, edit, reorder or remove each planet's directors and managers (name, photo, email, phone, LinkedIn, bio). Any number of each, so the manager count can change every year without affecting past years.
- **Admin → Planets**: rename planets, change their logo, description, responsibilities and web address, reorder them, or add and delete planets.

Public pages refresh as soon as you save. Photos that are replaced or removed are deleted from storage.

---

**Made with ❤️ and ✨ for astronomy enthusiasts**
