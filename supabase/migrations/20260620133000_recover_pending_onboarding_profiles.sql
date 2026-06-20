-- Recover users who got stuck in 'pending_minor_review' during onboarding
-- Since they never completed onboarding, they should be in 'approved' status
-- so they can successfully save their onboarding progress.

UPDATE public.profiles
SET review_status = 'approved'
WHERE onboarded = false AND review_status = 'pending_minor_review';
