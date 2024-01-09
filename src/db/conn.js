import mongoose from "mongoose";
const connectDb = async () => {
  try {
    const connectionReference = await mongoose.connect(process.env.MONGO_URI);
    console.log("host : ",connectionReference.connection.host);
    console.log("connection to database is successful");
  } catch (error) {
    console.log("error from mongoDbConnection", error);
    process.exit(1);
  }
};

export default connectDb;
