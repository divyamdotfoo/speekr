import { nanoid } from "nanoid";
import { getDatabaseClient } from "../client.ts";
import type { User, UserTrack } from "../../types/index.ts";

class UserService {
  createUser(name: string): User {
    const db = getDatabaseClient();

    const user: User = {
      id: nanoid(),
      name,
    };

    db.prepare("INSERT INTO users (id, name) VALUES (@id, @name)").run(user);

    return user;
  }

  createUserTrack(input: {
    userId: string;
    languageId: string;
    proficiency: number;
  }): UserTrack {
    const { userId, languageId, proficiency } = input;
    const db = getDatabaseClient();

    const track: UserTrack = {
      id: nanoid(),
      userId,
      language: languageId,
      proficiency,
    };

    db.prepare(
      "INSERT INTO user_tracks (id, user_id, language_id, proficiency) VALUES (@id, @userId, @languageId, @proficiency)"
    ).run({
      id: track.id,
      userId,
      languageId,
      proficiency,
    });

    return track;
  }

  getPrimaryUser(): User | null {
    const db = getDatabaseClient();

    const user = db.prepare("SELECT * FROM users").get() as User | undefined;
    return user ?? null;
  }

  getPrimaryUserTrack(userId: string): UserTrack | null {
    const db = getDatabaseClient();

    const track = db
      .prepare(
        `SELECT
          t.id,
          t.user_id as userId,
          l.code as language,
          t.proficiency
        FROM user_tracks t
        JOIN supported_languages l ON l.id = t.language_id
        WHERE t.user_id = ?
        LIMIT 1`
      )
      .get(userId) as UserTrack | undefined;
    return track ?? null;
  }

  listUserTracksByUserId(userId: string): Array<UserTrack & { languageLabel: string }> {
    const db = getDatabaseClient();
    return db
      .prepare(
        `SELECT
          t.id,
          t.user_id as userId,
          l.code as language,
          l.label as languageLabel,
          t.proficiency
        FROM user_tracks t
        JOIN supported_languages l ON l.id = t.language_id
        WHERE t.user_id = ?
        ORDER BY l.label ASC`
      )
      .all(userId) as Array<UserTrack & { languageLabel: string }>;
  }

  getUserWithAllTracks(): { user: User; tracks: Array<UserTrack & { languageLabel: string }> } | null {
    const user = this.getPrimaryUser();
    if (!user) {
      return null;
    }
    const tracks = this.listUserTracksByUserId(user.id);
    return { user, tracks };
  }
}

export const user = new UserService();

