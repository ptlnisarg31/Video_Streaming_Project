import dotenv from "dotenv";
import connectDB from "./db/connect.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen((finalPORT = process.env.PORT || 8000), () => {
      console.log(`\n Server is running on PORT : ${finalPORT} \n`);
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed !! ", error);
  });
