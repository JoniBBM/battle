-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('setup', 'running', 'paused', 'finished');

-- CreateEnum
CREATE TYPE "OccupationAction" AS ENUM ('enter', 'leave');

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'setup',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_occupation_events" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "action" "OccupationAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "zone_occupation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_captures" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "capturing_team_id" TEXT NOT NULL,
    "captured_team_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "station_name" TEXT NOT NULL,

    CONSTRAINT "band_captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_settings" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "points_per_second" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "band_capture_points" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "game_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_stations" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,

    CONSTRAINT "band_stations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_settings_game_id_key" ON "game_settings"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "band_stations_game_id_key" ON "band_stations"("game_id");

-- CreateIndex
CREATE INDEX "zone_occupation_events_zone_id_timestamp_idx" ON "zone_occupation_events"("zone_id", "timestamp");

-- CreateIndex
CREATE INDEX "zone_occupation_events_team_id_timestamp_idx" ON "zone_occupation_events"("team_id", "timestamp");

-- CreateIndex
CREATE INDEX "band_captures_game_id_timestamp_idx" ON "band_captures"("game_id", "timestamp");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_occupation_events" ADD CONSTRAINT "zone_occupation_events_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_occupation_events" ADD CONSTRAINT "zone_occupation_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_captures" ADD CONSTRAINT "band_captures_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_captures" ADD CONSTRAINT "band_captures_capturing_team_id_fkey" FOREIGN KEY ("capturing_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_captures" ADD CONSTRAINT "band_captures_captured_team_id_fkey" FOREIGN KEY ("captured_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_settings" ADD CONSTRAINT "game_settings_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_stations" ADD CONSTRAINT "band_stations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
