# CSR Dashboard → Live Website
## Step-by-step deployment guide

---

## Phase 1 — Deploy to Vercel (20 minutes, free)

This makes your dashboard a real URL anyone on your team can open.
No coding needed for this phase.

### Step 1 — Put your code on GitHub

1. Go to https://github.com and create a free account if you don't have one
2. Click **New repository** → name it `csr-dashboard` → set to Private → Create
3. Download GitHub Desktop from https://desktop.github.com (easiest way)
4. Open GitHub Desktop → File → Add local repository → point it to your project folder
5. Write a commit message like "Initial dashboard" → click **Commit** → **Push origin**

Your code is now on GitHub.

### Step 2 — Deploy on Vercel

1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New Project** → select your `csr-dashboard` repository
3. Vercel auto-detects it's a React app — leave all settings as default
4. Click **Deploy**
5. Wait about 90 seconds

You now have a live URL like `csr-dashboard.vercel.app`.
Share it with your TLs — they can open it on any browser, any device.

### Step 3 — Set a custom domain (optional, ~₱600/year)

1. Buy a domain at https://namecheap.com (e.g. `csr-dashboard.ph`)
2. In Vercel → your project → Settings → Domains → add your domain
3. Follow the DNS instructions Vercel shows you (takes ~10 minutes to activate)

Every time you push an update to GitHub, Vercel auto-redeploys in ~60 seconds.

---

## Phase 2 — Set up Supabase (1–2 hours)

### Step 1 — Create your Supabase project

1. Go to https://supabase.com → click **Start your project** → sign up free
2. Click **New project**
   - Name: `csr-performance`
   - Database password: save this somewhere safe
   - Region: Southeast Asia (Singapore) — closest to Philippines
3. Wait about 2 minutes for the project to provision

### Step 2 — Run the database schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase_schema.sql` (provided alongside this guide)
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (green button, top right)
6. You should see "Success. No rows returned" — that means it worked
7. Click **Table Editor** in the sidebar — you should see all 6 tables

Your database is live with all 16 CSRs and 5 teams already seeded.

### Step 3 — Get your Supabase credentials

1. In Supabase → Settings (gear icon) → API
2. Copy two values:
   - **Project URL** — looks like `https://abcdefg.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`
3. Keep these — you'll need them in the next phase

---

## Phase 3 — Connect the dashboard to Supabase (2–3 days dev work)

This is where the mock data gets replaced with real data.
You'll need a developer for this phase, or follow these steps yourself.

### Step 1 — Install the Supabase client

Open a terminal in your project folder and run:
```
npm install @supabase/supabase-js
```

### Step 2 — Create a Supabase config file

Create a new file in your project at `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

Replace the URL and key with the values from Step 3 above.

### Step 3 — Add environment variables to Vercel

Never hardcode credentials in your code. Instead:

1. In Vercel → your project → Settings → Environment Variables
2. Add two variables:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
3. Update `src/lib/supabase.js` to use:
   ```javascript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```

### Step 4 — Replace mock data with real queries

Example: replace the mock PERFORMANCE_DATA array with a real query.

**Before (mock data):**
```javascript
const PERFORMANCE_DATA = [ ...hardcoded array... ]
```

**After (real data from Supabase):**
```javascript
import { supabase } from './lib/supabase'

// Inside your component:
const { data, error } = await supabase
  .from('vw_csr_ranking')   // uses the view we created
  .select('*')
  .eq('year', 2026)
  .eq('quarter', 'Q2')

if (error) console.error(error)
// data is now your ranking array — same shape as PERFORMANCE_DATA
```

Do this replacement for each section:
- CSR Ranking → query `vw_csr_ranking`
- Team Performance → query `vw_team_averages`
- Weekly Scores → query `weekly_scores` filtered by csr_id + week
- QA Audit Log → query `qa_audits`
- Daily Scorecard → query `daily_records`
- Follow-up Tracker → query `followup_tracker`

### Step 5 — Wire up the data entry forms

Each "Save" button in the entry forms calls a Supabase insert:

```javascript
const { error } = await supabase
  .from('weekly_scores')
  .insert({
    csr_id: selectedCSRId,
    year: 2026,
    quarter: 'Q2',
    month: 'June',
    week_number: 1,
    followups_rmo: 88,
    rts_compliance: 90,
    delivery_success_rate: 93,
    // ... rest of the fields
    // Note: final_score, kra_scale, behavioral_scale are
    // auto-calculated by the database trigger — don't send them
  })

if (error) alert('Save failed: ' + error.message)
else alert('Saved successfully!')
```

---

## Phase 4 — TL Login (1 day)

### Step 1 — Create TL accounts in Supabase

1. Supabase → Authentication → Users → **Invite user**
2. Enter each TL's email address
3. They receive an email to set their password
4. Update the `teams` table with each TL's email:
   ```sql
   update public.teams
   set tl_email = 'tl.keljash@yourcompany.com'
   where team_name = 'Team Keljash';
   ```
   Repeat for all 5 teams.

### Step 2 — Add a login screen to the app

Create `src/LoginPage.jsx`:

```javascript
import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onLogin(data.user)
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  minHeight:'100vh', background:'#f8fafc' }}>
      <div style={{ background:'white', borderRadius:16, padding:40,
                    width:360, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize:20, fontWeight:700, marginBottom:24 }}>
          CSR Dashboard
        </h1>
        <input type="email" placeholder="TL email address"
          value={email} onChange={e => setEmail(e.target.value)}
          style={{ width:'100%', marginBottom:12, boxSizing:'border-box' }}/>
        <input type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)}
          style={{ width:'100%', marginBottom:16, boxSizing:'border-box' }}/>
        {error && <p style={{ color:'red', fontSize:13, marginBottom:12 }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:'10px 0', background:'#1d3a6e',
                   color:'white', border:'none', borderRadius:8,
                   fontSize:14, fontWeight:600, cursor:'pointer' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
```

### Step 3 — Protect the app with auth

In `src/App.jsx`, wrap the dashboard:

```javascript
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './LoginPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div>Loading…</div>
  if (!user)   return <LoginPage onLogin={setUser} />

  // Your existing dashboard here
  return ( /* ... your existing App JSX ... */ )
}
```

Now only logged-in TLs can access the dashboard.
Row Level Security ensures each TL only sees their own team's data.

---

## Phase 5 — Excel Upload (1–2 days)

Install SheetJS:
```
npm install xlsx
```

Add to the Excel upload tab in your dashboard:

```javascript
import * as XLSX from 'xlsx'
import { supabase } from './lib/supabase'

async function handleFileUpload(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

  // rows is now an array of objects matching your column headers
  // Map each row to the weekly_scores table shape, then:
  const { error } = await supabase
    .from('weekly_scores')
    .upsert(rows.map(r => ({
      // map your Excel column names to DB field names here
      csr_id:              lookupCSRId(r['CSR Name']),
      year:                r['Year'],
      quarter:             r['Quarter'],
      month:               r['Month'],
      week_number:         r['Week'],
      followups_rmo:       r['RMO %'],
      rts_compliance:      r['RTS %'],
      delivery_success_rate: r['Delivery %'],
      upsell_rate:         r['Upsell %'],
      attendance_kpi:      r['Attendance %'],
      // ... map remaining columns
    })))

  if (error) alert('Upload failed: ' + error.message)
  else alert(`${rows.length} records uploaded successfully!`)
}
```

---

## Summary — What each phase costs you

| Phase | Work | Time | Cost |
|-------|------|------|------|
| 1 — Vercel deploy | Minimal (no coding) | 20 min | Free |
| 2 — Supabase setup | Copy-paste SQL | 1–2 hrs | Free |
| 3 — Connect data | Developer needed | 2–3 days | Dev time only |
| 4 — TL login | Developer needed | 1 day | Dev time only |
| 5 — Excel upload | Developer needed | 1–2 days | Dev time only |
| Optional domain | None | 10 min | ~₱600/year |

**Total infrastructure cost: ₱0–600/year**
Everything runs on Supabase free tier (up to 50,000 rows, 500MB storage)
and Vercel free tier (unlimited deploys, custom domain supported).

---

## When you outgrow the free tier

Supabase Pro is $25/month (~₱1,400) and gives you:
- Unlimited rows
- Daily backups
- Priority support
- More storage

For a team of 16–20 CSRs, the free tier will last years.
