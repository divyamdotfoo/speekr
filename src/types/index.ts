export type User = {
  id: string;
  name: string;
  updatedAt: string;
};

export type UserTrack = {
  id: string;
  userId: string;
  language: string;
  proficiency: string;
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
