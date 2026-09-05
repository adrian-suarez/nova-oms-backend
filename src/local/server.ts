import express from "express";
import "dotenv/config";

import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";

const app = express()

app.use(express.json());
//routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(usersRoutes);

app.listen(3000,()=>{
    console.log("Nova OMS Local");
    console.log("http://localhost:3000");

});