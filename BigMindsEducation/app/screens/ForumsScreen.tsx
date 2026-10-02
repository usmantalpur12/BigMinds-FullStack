/**
 * DEPRECATED: This screen used the legacy /api/forums endpoint which no longer exists.
 * All forum functionality is now handled by app/(tabs)/forums.tsx using the correct
 * /api/forum routes via forumService.ts.
 *
 * This file redirects to the active forums tab to prevent a broken experience
 * if anything still navigates here.
 */
import { Redirect } from 'expo-router';

export default function ForumsScreenRedirect() {
  // Redirect to the canonical forums tab
  return <Redirect href="/(tabs)/forums" />;
}