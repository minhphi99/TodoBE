import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // TODO: Move this to the .env file
      // TODO: Move this to the .env file
      dbName: "todo_app",
    });
    // TODO: Replace this with a logger
    console.log("mongoDB connected");
  } catch (error) {
    // TODO: Replace this with a logger
    console.error("error", error);
    // TODO: Replace this with a more graceful error handling mechanism
    process.exit(1);
  }
};

export default connectDB
