# WorkspaceOS – Product Specification

## 1. PRODUCT OVERVIEW

WorkspaceOS is a large-scale, enterprise-grade workspace operating system inspired by ClickUp.
It supports task management, CRM, chat, team management, dashboards, and agentic AI.

This is NOT an MVP.
This product must feel like it was built by a large, experienced team over several months.

Core principles:
- Workspace-first architecture
- Strict data isolation
- Dense, professional UI
- Agentic AI (tool-based, no hallucinations)

---

## 2. CORE CONCEPT: WORKSPACE

A Workspace is the top-level isolation boundary.

Rules:
- Every feature, page, and record belongs to exactly one workspace
- Users can belong to multiple workspaces
- Users can NEVER access data outside their workspace
- Every database table must include `workspace_id`
- AI queries must always be scoped by `workspace_id`

---

## 3. USER SYSTEM

### User
- Global account
- Unique username (mandatory, immutable)
- Username is used for:
  - Chat
  - Mentions
  - Invitations
  - AI references

Users may belong to multiple workspaces via workspace membership.

---

## 4. WORKSPACE MEMBERSHIP & ROLES

Users join workspaces via invitations.

Roles:
- Owner
- Admin
- Member
- Viewer

Permissions are enforced on backend and frontend.

---

## 5. GLOBAL LAYOUT (NON-NEGOTIABLE)

The app uses:
- 1 Global Header
- 2 Sidebars
- 1 Main Content Area

### Layout Structure

Global Header (Top)
Sidebar 1 (Left, static, icon-only)
Sidebar 2 (Left, dynamic, context-based)
Main Content Area (Right)

This layout exists on all authenticated workspace pages.

## 5.1 DESIGN SYSTEM & THEMING (CRITICAL)

The application supports TWO themes:
- Premium Light Mode
- Premium Dark Mode

Theme switching is available in user preferences.

This is a NON-NEGOTIABLE requirement.

---

## 5.2 LIGHT MODE (PREMIUM WHITE)

Light mode is NOT plain white.
It uses layered whites and soft neutrals.

Rules:
- Background: off-white (not pure white)
- Main content surface: true white
- Borders: zinc / slate tones only
- Shadows: very subtle, low contrast
- Text: dark grey, never pure black

Goal:
- Calm
- Professional
- Document-like
- Enterprise SaaS feel

---

## 5.3 DARK MODE (PREMIUM DARK)

Dark mode is NOT pitch black everywhere.

Rules:
- App background: near-black / zinc-950
- Sidebars: deep dark grey
- Main content surface: slightly lighter dark layer
- Borders: subtle grey
- Text: soft white / muted grey

Goal:
- Low eye strain
- High contrast without harshness
- “Power user” experience

---

## 5.4 COLOR POLICY (VERY IMPORTANT)

The product MUST NOT use vibrant or playful colors.

Allowed:
- White
- Off-white
- Grey
- Zinc
- Slate
- Muted status indicators only

Restricted:
- No bright blues
- No neon colors
- No gradients
- No rainbow tags

Status colors (only place with color):
- Todo: muted grey
- In Progress: muted blue-grey
- Done: muted green-grey

These colors must be subtle and desaturated.

---

## 5.5 COMPONENT DESIGN RULES

- Flat design with depth through layering, not shadows
- Rounded corners only where necessary
- Consistent spacing rhythm
- Dense information, not airy marketing UI

This product must look like:
“Built for daily work by professionals”

---

## 6. GLOBAL HEADER

Always visible.

Contains:
- Workspace Selector (dropdown)
- Global Search (Ctrl + K)
- AI Button (Agent Command Center)
- Notifications
- User Avatar Menu

Switching workspace:
- Resets UI state
- Reloads sidebars
- Resets AI context

---

## 7. SIDEBAR 1 – PRIMARY NAVIGATION (STATIC)

Width: 72px  
Theme: Dark

Purpose: High-level product modules

Items:
- Home
- Tasks
- CRM
- Chat
- Docs
- Dashboards
- Team
- Settings

This sidebar NEVER changes.

---

## 8. SIDEBAR 2 – CONTEXT SIDEBAR (DYNAMIC)

Width: 260px  
Theme: Dark

This sidebar changes based on the active module from Sidebar 1.

---

## 9. TASKS MODULE (CORE FEATURE)

### Hierarchy

Workspace  
→ Space  
→ Folder (optional)  
→ List  
→ Tasks  

### Sidebar 2 (Tasks)
- Spaces displayed as bold headers
- Folders are collapsible
- Lists are clickable
- Active list highlighted
- Omni-create (+) button for:
  - Space
  - Folder
  - List
  - Sprint Folder

---

## 10. TASK VIEWS

Each List supports:
- List View (default, dense table)
- Board View (Kanban by status)
- Calendar View
- Gantt View
- Table View

Rows:
- Compact (40px)
- Inline editable
- Keyboard-friendly

---

## 11. TASK DETAIL VIEW

Opens as a slide-over panel from the right (60% width).

Contains:
- Task ID
- Editable title
- Rich text description
- Subtasks checklist
- Activity & comments

---

## 12. AI FEATURES INSIDE TASKS

AI is assistive, not intrusive.

Features:
- “Write with AI” triggered by `/`
- Auto-generate subtasks from description
- Summarize comments (only when >10 comments)

AI must only use real task data.

---

## 13. CHAT MODULE

Workspace-scoped chat system.

### Channels
- Public workspace channels (e.g. #general)
- Created per workspace

### Direct Messages
- Username-based
- Only between users in the same workspace

Features:
- Mentions (@username)
- Task links
- AI assistance inside chat

---

## 14. CRM MODULE (MANDATORY)

CRM exists under the same workspace.

### CRM Sidebar
- Dashboard
- Companies
- Contacts
- Leads
- Deals
- Reports

### CRM Entities
- Company
- Contact
- Lead
- Deal

Each entity has:
- List view
- Detail page
- Relationships with other entities

---

## 15. TEAM MANAGEMENT

Route:
`/workspace/{workspace_id}/team`

Features:
- View members
- Invite by email or username
- Assign roles
- Pending invitations
- Remove users

---

## 16. AUTHENTICATION & BOOTSTRAP FLOW

On user signup:
1. Create User
2. Create Workspace
3. Create default Space ("General")
4. Create default List ("Inbox")
5. Create default chat channel (#general)
6. Add user as Workspace Owner

Redirect:
`/workspace/{workspace_id}/home`

---

## 17. AGENTIC AI SYSTEM (CRITICAL)

AI is tool-based and deterministic.

Rules:
- AI NEVER hallucinates
- AI NEVER invents data
- AI ALWAYS uses backend tools
- Every AI call includes `workspace_id`

Example tools:
- GetMyTasks
- GetTasksByList
- GetCRMLeads
- CreateSubtasks
- SummarizeComments

AI responses must reference real entities.

---

## 18. TECH STACK CONSTRAINTS

Frontend:
- React
- Professional, dense UI
- Dark sidebars, light content

Backend:
- .NET
- Secure auth
- Role-based access

Database:
- PostgreSQL
- Workspace-first schema
- Indexed by workspace_id

---

## 19. QUALITY BAR

This application must:
- Feel fast
- Feel stable
- Feel enterprise-grade
- Match or exceed ClickUp UX quality

This is NOT a demo or prototype.
This is a production-ready platform.
