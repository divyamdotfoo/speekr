import { Command } from "commander";
import { resetDatabase, setupDatabase } from "./db/queries.ts";

export function cli() {
  const program = new Command();

  program.name("speekr").description("Practice speaking languages locally");

  program
    .command("start")
    .description("Start the application")
    .action(() => {
      console.log("Starting the application");
    });

  program
    .command("setup")
    .description("Setup db")
    .action(() => {
      setupDatabase();
      console.log("Database tables created");
    });

  program
    .command("reset")
    .description("Delete the database")
    .action(() => {
      resetDatabase();
      console.log("Database deleted");
    });

  program
    .command("record")
    .description("Start new learing session")
    .action(() => {
      console.log("Recording a new audio file");
    });

  program
    .command("list")
    .description("List all learning sessions")
    .action(() => {
      console.log("Listing all learning sessions");
    });

  program.parse(process.argv);
}
