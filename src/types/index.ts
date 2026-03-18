export type User = {
  id: string;
  name: string;
};

export type UserTrack = {
  id: string;
  userId: string;
  language: string;
  proficiency: ProficiencyLevel;
};

export type UserSession = {
  id: string;
  userId: string;
  userTrackId: string;
};

export type Configuration = {
  openAIKey: string | null;
  anthropicKey: string | null;
};

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";
