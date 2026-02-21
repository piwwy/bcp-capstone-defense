-- ================================================================
-- TRIGGER: Update Campaign Progress Automatically
-- Module: Donations
-- Date: 2026-02-21
-- ================================================================
-- This trigger ensures that 'current_amount' in donation_campaigns
-- is ALWAYS in sync with verified donations, even if manual
-- updates are missed or errors occur.
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_donation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. If a donation becomes 'verified'
  IF (TG_OP = 'INSERT' AND NEW.status = 'verified') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified')) THEN
    UPDATE public.donation_campaigns
    SET current_amount = current_amount + NEW.amount
    WHERE id = NEW.campaign_id;
  
  -- 2. If a donation was 'verified' but status changed to something else
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'verified' AND NEW.status != 'verified') THEN
    UPDATE public.donation_campaigns
    SET current_amount = current_amount - OLD.amount
    WHERE id = OLD.campaign_id;
  
  -- 3. If a verified donation is deleted
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'verified') THEN
    UPDATE public.donation_campaigns
    SET current_amount = current_amount - OLD.amount
    WHERE id = OLD.campaign_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS tr_donation_status_update ON public.donations;
CREATE TRIGGER tr_donation_status_update
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.handle_donation_status_change();

-- ================================================================
-- ONE-TIME SYNC: Ensure all campaign amounts are correct
-- ================================================================
UPDATE public.donation_campaigns c
SET current_amount = COALESCE((
  SELECT SUM(amount)
  FROM public.donations d
  WHERE d.campaign_id = c.id AND d.status = 'verified'
), 0);
