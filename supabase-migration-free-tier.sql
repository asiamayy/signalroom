-- Add a genuine free tier below Pulse/Signal/Broadcast. Previously new users
-- were auto-assigned 'starter' (Pulse's feature limits) with no billing at
-- all, which made the $199/month "Pulse" price tag misleading. Now new
-- signups default to 'free' (1 persona, 1 interview/month, no card required),
-- and 'starter'/Pulse becomes the first tier someone actually pays for.
-- Existing users already on 'starter' are left as-is by this migration —
-- they keep the plan they're on; only the default for brand-new rows changes.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'agency'));
ALTER TABLE profiles ALTER COLUMN plan SET DEFAULT 'free';
