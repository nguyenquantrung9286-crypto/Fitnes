-- Удалить избыточную публичную политику
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Оставить только владельческий доступ
DROP POLICY IF EXISTS "Users can manage their own scans" ON storage.objects;

CREATE POLICY "Users can view own scans"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'food-scans' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own scans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'food-scans' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own scans"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'food-scans' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
