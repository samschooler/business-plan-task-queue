import "dotenv/config";
import { run } from "graphile-worker";

async function main() {
  // Run a worker to execute jobs:
  const runner = await run({
    connectionString: process.env.DATABASE_URL,
    taskDirectory: `${__dirname}/tasks`,
  });

  runner.events.on("job:success", ({ worker, job }) => {
    console.log(`Hooray! Worker ${worker.workerId} completed job ${job.id}`);
  });

  runner.events.on("job:failed", ({ worker, job }) => {
    console.log(`Boo! Worker ${worker.workerId} failed job ${job.id}`);
  });

  runner.events.on("pool:listen:connecting", ({ workerPool }) => {
    console.log(`Worker pool connecting`);
  });

  runner.events.on("pool:listen:success", ({ workerPool }) => {
    console.log(`Worker pool listening`);
  });

  runner.events.on("pool:listen:error", ({ error }) => {
    console.error(`Worker pool listening error: ${error}`);
  });

  // Immediately await (or otherwise handled) the resulting promise, to avoid
  // "unhandled rejection" errors causing a process crash in the event of
  // something going wrong.
  await runner.promise;

  // If the worker exits (whether through fatal error or otherwise), the above
  // promise will resolve/reject.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
