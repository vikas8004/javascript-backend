import dotenv from "dotenv";
dotenv.config({
  path:'./.env'
});
import connectDb from "./db/conn.js";
import { app } from "./app.js";



connectDb()
  .then((res) => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(
        `ur applicaton is running on the port number ${process.env.PORT}`
      );
    });
  })
  .catch((err) => {
    console.log("mongo db connection failed ", err.message);
  });
