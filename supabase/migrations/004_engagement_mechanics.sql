-- Migration: 004_engagement_mechanics.sql
-- Enables the Hooked Model via streaks and milestones

-- 1. Reading Streaks Table
CREATE TABLE public.reading_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_read_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS for reading_streaks
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reading streaks"
    ON public.reading_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage streaks"
    ON public.reading_streaks FOR ALL
    USING (auth.role() = 'service_role');

-- 2. Creator Milestones Table
CREATE TABLE public.creator_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- e.g., 'FIRST_READER', '100_READERS', '1K_INR'
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE, -- To trigger UI modals once
    metadata JSONB, -- Context, e.g., which story got the first reader
    UNIQUE(creator_id, milestone_type)
);

-- RLS for creator_milestones
ALTER TABLE public.creator_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view their own milestones"
    ON public.creator_milestones FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can acknowledge milestones"
    ON public.creator_milestones FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Service role can manage milestones"
    ON public.creator_milestones FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_reading_streaks_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reading_streaks_modtime
    BEFORE UPDATE ON public.reading_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_streaks_modtime();
