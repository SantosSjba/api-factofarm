-- Inmutabilidad fiscal: bloqueo DELETE físico (solo anulación lógica en aplicación)
CREATE OR REPLACE FUNCTION prevent_fiscal_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE prohibido en % (registro fiscal). Use anulación lógica.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'Sale',
    'SaleItem',
    'Payment',
    'ElectronicDocument',
    'SaleReturn',
    'SaleSubstitution'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_fiscal_delete ON %I', tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_prevent_fiscal_delete BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION prevent_fiscal_delete()',
      tbl
    );
  END LOOP;
END $$;
