import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // disable in prod!
  entities: [__dirname + "/../models/**/*.{js,ts}"],
  ssl: {
    rejectUnauthorized: false,
  },
});

export const createAppDataSource = async () => {
  await AppDataSource.initialize();
  console.log("Connected to PostgreSQL");
};
