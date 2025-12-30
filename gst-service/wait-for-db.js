const net = require("net");

const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT || 5432;

console.log(`⏳ Waiting for DB at ${host}:${port}...`);

const waitForDB = () => {
  const socket = new net.Socket();

  socket.setTimeout(1000);
  socket.on("connect", () => {
    console.log("✅ Database is ready!");
    socket.destroy();
    process.exit(0);
  });

  socket.on("error", () => {
    console.log("⏳ DB not ready, retrying...");
    socket.destroy();
    setTimeout(waitForDB, 1000);
  });

  socket.on("timeout", () => {
    socket.destroy();
    setTimeout(waitForDB, 1000);
  });

  socket.connect(port, host);
};

waitForDB();
