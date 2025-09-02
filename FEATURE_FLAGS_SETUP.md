# Feature Flags Setup Instructions

## 1. Run the Database Migration

First, you need to create the `user_features` table in your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_create_user_features_table.sql`
4. Run the SQL to create the table

## 2. Grant Feature Access via Supabase Dashboard

You can manage feature flags directly in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor > user_features
3. Click "Insert" > "Insert row"
4. Fill in:
   - `user_id`: The UUID of the user you want to grant access to
   - `feature`: `create_baby_pool` (or any other feature from the FEATURES list)
   - `granted_at`: Will auto-populate with current timestamp
   - `granted_by`: Optional - your user ID if you want to track who granted it

### How to find a user's ID:
1. Go to Authentication > Users in your Supabase dashboard
2. Find the user and copy their UUID, or
3. Ask the user to sign in and add this temporary code to any page:
```tsx
const { data: { user } } = await supabase.auth.getUser();
console.log("User ID:", user?.id);
```

### To revoke access:
1. Go to Table Editor > user_features  
2. Find the row with the user_id and feature
3. Click the delete button for that row

## 3. Test the Feature Flags

1. Try visiting `/baby/create` with a user who doesn't have the feature - they should see an access denied message
2. Try visiting `/baby/create` with a user who has been granted the feature - they should see the create form
3. Check the navigation menu - users without the feature shouldn't see the "Create Baby Pool" link

## 4. Adding New Features

To add new features in the future:

1. Add the feature name to `FEATURES` in `/lib/features/types.ts`
2. Use `hasFeatureAccess()` in server components or `<FeatureGate>` in client components
3. Grant access by adding rows to the `user_features` table in Supabase

## Current Features

- `create_baby_pool` - Allows users to create new baby betting pools

## Security Notes

- The user_features table has RLS enabled and users can only see their own features
- Direct modifications to user_features are blocked via RLS policy (except for the table editor)
- You can manage all feature flags directly through the Supabase dashboard
