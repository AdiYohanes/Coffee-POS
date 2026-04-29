- **Auth Stack Recommendation**
  - **Comparison**
    | Feature | `lucia-auth` + `drizzle-adapter` | Custom Session (Lean v1) |
    | :--- | :--- | :--- |
    | **Status** | v3 deprecated, heavy abstractions | Lightweight, native Next.js 15 support |
    | **DB Queries** | Managed by adapter | Explicitly controlled via Drizzle |
    | **Edge Support** | Complicated in Edge Middleware | Simple cookie presence check |
  - **Recommendation**: Custom Session
  - **Password Hashing**: Use `bcrypt` or `argon2` directly in the Server Action for comparing hashes stored in the DB.
  - **Justification for Next.js 15 Server Actions**: Server Actions natively handle `cookies()` API. A custom session avoids deprecated `lucia-auth` v3 overhead, provides explicit control over Drizzle DB calls, and keeps the v1 implementation lean and strictly tied to Node runtime capabilities.

- **Server Action Signatures**
  - `loginAction(values: z.infer<typeof loginSchema>): Promise<AuthResponse>`
  - `logoutAction(): Promise<AuthResponse>`
  - `getSessionAction(): Promise<AuthResponse>`

- **Zod Validation Schema**
  - `email`: `z.string().email("Invalid email")`
  - `password`: `z.string().min(8, "Password must be at least 8 characters")`

- **Response Envelope**
  - `success`: `boolean`
  - `data` (optional):
    - `user`:
      - `id`: `string`
      - `name`: `string`
      - `role`: `"admin" | "cashier" | "barista"`
      - `email`: `string`
    - `expires`: `string`
  - `error` (optional): `string`

- **Cookie Configuration**
  | Property | Value |
  | :--- | :--- |
  | `name` | `pos_session` |
  | `httpOnly` | `true` |
  | `secure` | `process.env.NODE_ENV === "production"` |
  | `sameSite` | `lax` |
  | `maxAge` | `60 * 60 * 24 * 7` |
  | `path` | `/` |

- **Routing & Protection Rules**
  - **Role Access Table**
    | Route | Required Role(s) |
    | :--- | :--- |
    | `/login` | Public |
    | `/dashboard` | `admin`, `cashier`, `barista` |
    | `/pos` | `admin`, `cashier` |
    | `/inventory` | `admin`, `barista` |
    | `/settings` | `admin` |
  - **Edge Middleware Strategy (Role Checks)**
    - **Step 1 (Middleware - Edge)**: Check for existence of `pos_session` cookie. If absent, redirect to `/login`. Do NOT query Postgres.
    - **Step 2 (Server Component - Node)**: Await `getSessionAction()` to validate session ID against the DB and retrieve user role.
    - **Step 3 (Role Enforcement - Node)**: Compare retrieved role against path requirements. If unauthorized, redirect to `/dashboard` or show a 403 state.
    - **Step 4 (Server Actions - Node)**: Every mutating Server Action must call `getSessionAction()` internally to verify permissions before executing DB writes.

- **Environment Variables**
  | Variable | Purpose |
  | :--- | :--- |
  | `AUTH_SECRET` | Used to cryptographically sign the session cookie to prevent tampering |
  | `DATABASE_URL` | Used for querying users and sessions tables |
  - **Generating `AUTH_SECRET`**
    - Terminal: `openssl rand -base64 32`
    - Node.js: `node -e "console.log(crypto.randomBytes(32).toString('base64'))"`
