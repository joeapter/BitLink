-- Merge auth identity: joe@bitlink.co.il auth user → joeapter@gmail.com customer record
-- The checkout was completed under joeapter@gmail.com but the admin portal logs in as
-- joe@bitlink.co.il. getAccountSnapshot looks up customer by user_id, so the portal
-- was finding the wrong (empty) customer. This migration attaches the admin auth user
-- to the customer that has the actual telecom line, Stripe subscription, and orders.

DO $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  SELECT id INTO v_admin_user_id
  FROM public.profiles
  WHERE email = 'joe@bitlink.co.il'
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RAISE NOTICE 'joe@bitlink.co.il profile not found — skipping migration';
    RETURN;
  END IF;

  -- Detach the admin auth user from the empty customer stub
  UPDATE public.customers
  SET user_id = NULL
  WHERE email = 'joe@bitlink.co.il'
    AND user_id = v_admin_user_id;

  -- Attach the admin auth user to the real customer record
  UPDATE public.customers
  SET user_id = v_admin_user_id
  WHERE email = 'joeapter@gmail.com';
END $$;
