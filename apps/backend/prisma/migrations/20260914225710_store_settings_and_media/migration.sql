-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" VARCHAR(200) NOT NULL,
    "companyRuc" VARCHAR(11) NOT NULL,
    "companyEmail" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "yapePhone" VARCHAR(20) NOT NULL,
    "yapeQrUrl" VARCHAR(512),
    "paymentWindowHours" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" UUID,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "settingsId" TEXT NOT NULL,
    "bank" VARCHAR(80) NOT NULL,
    "accountNumber" VARCHAR(40) NOT NULL,
    "cci" VARCHAR(40) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "filename" VARCHAR(160) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(80) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" UUID,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_settingsId_position_idx" ON "bank_accounts"("settingsId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_filename_key" ON "media_assets"("filename");

-- CreateIndex
CREATE INDEX "media_assets_createdAt_idx" ON "media_assets"("createdAt");

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "store_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
