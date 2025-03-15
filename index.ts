import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import dbConnect, { collection } from "./db/db-connect";
// import genRandom from "./utils/random";
import { runAIWorkFlow } from "./workflow/langflow";


// dotenv.config();
// import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });



const app = express();
const PORT = process.env.PORT;

dbConnect();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});


app.use((req, res, next) => {
  console.log("Incoming Request:", req.method, req.path);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});


app.get('/', (req, res) => {
  res.send('Backend is running');
});

// for generating demo-posts
// app.get("/demo-posts", (req: Request, res: Response) => {
//   const userId = req.query.userid;

//   const numberOfPosts: number = parseInt(req.query.n as string) || 10;

//   const POST_TYPES = ["reel", "static image", "carousel"];

//   const posts = [];

//   for (let i = 0; i < numberOfPosts; i++) {
//     posts.push({
//       user_id: userId,
//       post_type: POST_TYPES[genRandom(0, 3)],
//       likes: genRandom(30, 500),
//       comments: genRandom(30, 1000),
//       shares: genRandom(10, 600),
//     });
//   }

//   res.status(200).json({ posts });
// });

// for putting the data's to the db
app.post("/put-posts", async (req: Request, res: Response) => {
  const posts: {
    post_url: string;
    hashtags: string;
  }[] = req.body.posts;

  
  try {
    const response = await collection.insertMany(posts);
    console.log(response);
    res
      .status(200)
      .json({ message: "Posts are inserted into the db successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server problem in putting the posts" });
  }
});

// for putting demo posts
// Remove userId from query and ensure AI processes the prompt directly
app.get("/analyse-posts", async (req: Request, res: Response) => {
  const hashtags: string = req.query.ptype as string; // Get the post type from query params

  try {
    // Fetch competitor data based on hashtags
    const response = await runAIWorkFlow(
      `Fetch competitor data for the following hashtags: hashtags  don't give me _id in output`
    );

    // Log response to check if it’s fetching data correctly
    console.log("Fetched competitor data:", response);

    res.status(200).json({ response }); // Send the data back to frontend
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data." });
  }
});


app.listen(PORT, () => {
  console.log("Server is listening in the port " + PORT);
});

// for chatting with the model
// Remove userId from request body and ensure the AI processes the prompt directly
app.post("/chat", async (req: Request, res: Response) => {
  const prompt: string = req.body.prompt as string;

  try {
    const aiResponse = await runAIWorkFlow(prompt);

    res.status(200).json({ response: aiResponse });
    console.log(aiResponse);
  } catch (error) {
    console.error("❌ Error processing AI response:", error);
    res.status(500).json({ response: "Error processing the request." });
  }
});





// app.post("/review", async (req: Request, res: Response) => {
//   try {
//     // Ensure request has JSON body
//     if (!req.is("application/json")) {
//       return res.status(400).json({ error: "Invalid Content-Type, expected application/json" });
//     }

//     const { code } = req.body;

//     if (!code) {
//       return res.status(400).json({ error: "Code is required for review." });
//     }

//     // AI Workflow Processing
//     const response = await runAIWorkFlow(`Review this code:\n${code}`);

//     res.status(200).json({ feedback: response });
//   } catch (error) {
//     console.error("Error processing code review:", error);
//     res.status(500).json({ error: "Failed to review code." });
//   }
// });
