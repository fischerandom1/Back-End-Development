const app = require("./controller/app.js");
const serveStatic = require("serve-static");

const port = 8080;
const server = app.listen(port, () => {
  console.log("Web App Hosted at http://localhost:%s", port);
});

app.use(serveStatic(__dirname + "/uploads"));

// Handle termination signals (e.g., Ctrl+C)
process.on("SIGINT", () => {
  console.log("Server is shutting down...");

  // Close the server gracefully
  server.close(() => {
    console.log("Server has been stopped.");
    process.exit(0);
  });
});
