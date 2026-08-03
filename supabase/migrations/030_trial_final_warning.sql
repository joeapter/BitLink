-- Trial default flip: unconverted trials now auto-continue on Basic (charged)
-- at the decision deadline instead of auto-freezing. This tracks the final
-- pre-charge warning separately from the existing day-~21 "pick your plan"
-- reminder, so each only ever sends once.

alter table public.trial_lines
  add column final_warning_sent_at timestamptz;
