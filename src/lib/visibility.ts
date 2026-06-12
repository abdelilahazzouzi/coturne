// Privacy helpers for the Roomies app.
// - Same-gender matching only (this is a roommate app, not a dating app).
// - Photos of female members are only shown to other female members.

export function canSeePhoto(viewerGender?: string | null, targetGender?: string | null) {
  if (targetGender !== "female") return true;
  return viewerGender === "female";
}

export function canMatch(viewerGender?: string | null, targetGender?: string | null) {
  if (!viewerGender || !targetGender) return false;
  return viewerGender === targetGender;
}
