const fastify = require("fastify")({ logger: true });
const path = require("path");

fastify.register(require("fastify-socket.io"), {
  cors: {
    origin: "*", // Mengizinkan semua sumber
    methods: ["GET", "POST"],
  },
});

// Menyimpan daftar klien yang terhubung
let connectedClients = {};

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

// Endpoint HTTP untuk Dashboard
fastify.get("/", (request, reply) => {
  reply.sendFile("dashboard.html"); // Mengirimkan dashboard HTML sederhana
});

// Saat server siap, jalankan pengaturan Socket.io
fastify.ready().then(() => {
  fastify.io.on("connection", (socket) => {
    // Tambahkan klien ke daftar
    connectedClients[socket.id] = socket.request.headers.origin || "unknown";

    // Log dan update dashboard setiap kali klien terhubung
    console.log(`Client connected: ${socket.id} from ${connectedClients[socket.id]}`);
    updateDashboard();

    // Saat klien mengirim pesan, log ke server
    socket.on("message", (msg) => {
      console.log(`Message from client ${socket.id}: ${msg}`);
    });

    // Saat tombol Show Alert ditekan di dashboard, kirim pesan ke semua klien
    socket.on("alertClients", (alertMessage) => {
      fastify.io.emit("alert", alertMessage); // Kirim pesan alert ke semua klien
    });

    // Saat klien terputus, hapus dari daftar dan update dashboard
    socket.on("disconnect", () => {
      delete connectedClients[socket.id];
      console.log(`Client disconnected: ${socket.id}`);
      updateDashboard();
    });
  });
});

// Fungsi untuk mengirim data terbaru ke dashboard
function updateDashboard() {
  fastify.io.emit("updateDashboard", {
    count: Object.keys(connectedClients).length,
    clients: connectedClients,
  });
}

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT || 3000, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
// Run the server and report out to the logs
// fastify.listen(
//   { port: process.env.PORT, host: "0.0.0.0" },
//   function (err, address) {
//     if (err) {
//       console.error(err);
//       process.exit(1);
//     }
//     console.log(`Your app is listening on ${address}`);
//   }
// );
