import corsProxy from "cors-anywhere";

const host = "0.0.0.0";
const port = "3000";

corsProxy
  .createServer({
    originWhitelist: ["http://localhost:5173"], // Allow all origins
    requireHeader: [],
    removeHeaders: ["cookie", "cookie2"],
  })
  .listen(port, host, function () {
    console.log("Running CORS Anywhere on " + host + ":" + port);
  });
