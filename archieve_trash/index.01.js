//base index file template for db connection and dotenv configuration

import dotenv from "dotenv";
import connectDB from "./db/connect.js";

dotenv.config({
  path: "./env",
});
connectDB();
