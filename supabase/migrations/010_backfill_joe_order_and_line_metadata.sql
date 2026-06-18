-- Backfill: create Joe's order record (Stripe webhook fired before order insert was deployed)
-- and store phone number + eSIM details in telecom_line metadata.

DO $$
DECLARE
  v_customer_id uuid;
  v_plan_id     uuid;
BEGIN
  -- Find Joe's customer by email
  SELECT id INTO v_customer_id FROM public.customers WHERE email = 'joeapter@gmail.com' LIMIT 1;
  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'joeapter@gmail.com customer not found — skipping';
    RETURN;
  END IF;

  -- Find plan
  SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'max-5g' LIMIT 1;

  -- Insert order if not already present
  INSERT INTO public.orders (
    customer_id, plan_id, stripe_checkout_session_id,
    payment_status, order_status, provisioning_status
  )
  VALUES (
    v_customer_id, v_plan_id,
    'cs_live_b1W1W3ZA32eb2u09VjvGpm8vzy1B5B9tUe4GEi69lDKJJxPylXYA2Vrz18',
    'paid', 'processing', 'active'
  )
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING;

  -- Stamp phone number and eSIM details on the telecom line
  UPDATE public.telecom_lines
  SET metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{phone_number}', '"+972555195335"',
        true
      ),
      '{esim_icc_id}', '"89972261000003604004"',
      true
    ),
    '{esim_activation_code}', '"1$consumer.rsp.world$JTALZHCYQQYTEIMT3XKLKXQN"',
    true
  )
  WHERE customer_id = v_customer_id
    AND provider_line_id = 'fb535de3-abc9-4b2a-8979-96eb437bfdcd';
END $$;
