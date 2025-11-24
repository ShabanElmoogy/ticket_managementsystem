ALTER TABLE "docs" ALTER COLUMN "blocks" SET DATA TYPE json USING 
  CASE 
    WHEN "blocks" IS NULL OR "blocks" = '' THEN '[]'::json
    ELSE "blocks"::json
  END;
ALTER TABLE "docs" ALTER COLUMN "blocks" SET DEFAULT '[]'::json;
ALTER TABLE "docs" ALTER COLUMN "blocks" SET NOT NULL;
