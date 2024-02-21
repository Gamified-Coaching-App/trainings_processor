import express from 'express';
import { garmin_handler } from './garmin_handler.mjs';

const app = express();
app.use(express.json()); 

// Define a POST endpoint that uses the garmin_handler
app.post('/update/garmin', (req, res) => {
    // Immediately respond to the request
    res.status(200).send({ message: "Processing started" });

    // Process the request body asynchronously
    console.log("Starting garmin_handler with request body:", req.body);
    garmin_handler(req.body).then(response => {
        console.log("Processing completed successfully:", response);
    }).catch(error => {
        console.error("Error during processing JSON:", error);
    });
});

// Listen on port 80
app.listen(80, () => {
    console.log('Server running on port 80');
});