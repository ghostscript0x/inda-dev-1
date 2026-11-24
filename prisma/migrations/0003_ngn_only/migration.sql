-- The store sells in NGN only.
ALTER TABLE "Product" DROP COLUMN "priceUSD";

-- Shrink the Currency enum to NGN. The cast fails (and the migration rolls back)
-- if any USD orders exist, rather than silently relabelling their amounts.
ALTER TYPE "Currency" RENAME TO "Currency_old";
CREATE TYPE "Currency" AS ENUM ('NGN');
ALTER TABLE "Order" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
DROP TYPE "Currency_old";
