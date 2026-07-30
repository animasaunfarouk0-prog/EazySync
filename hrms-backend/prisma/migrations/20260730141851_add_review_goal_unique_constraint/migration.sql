/*
  Warnings:

  - A unique constraint covering the columns `[review_id,goal_id]` on the table `review_goal_ratings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "review_goal_ratings_review_id_goal_id_key" ON "review_goal_ratings"("review_id", "goal_id");
