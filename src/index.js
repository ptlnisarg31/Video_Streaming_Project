import mongoose from "mongoose";
import { DB_NAME } from "./constants";

/*

import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";
const app = express();
// function connectDB(){

// }

//IIFY approach to connectMongoDB
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("Error", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`listening on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting", error);
  }
})();


*/